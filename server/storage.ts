import { eq, and, gte, lte, sql } from "drizzle-orm";
import { db } from "./db";
import {
  users,
  tables,
  reservations,
  sections,
  branches,
  customers,
  orders,
  orderItems,
  menuItems,
  menuCategories,
  menuItemBranches,
  type InsertUser,
  type InsertTable,
  type User,
  type Table,
  type Reservation,
  type Order,
  type InsertOrder,
  type OrderItem,
  type InsertOrderItem,
  type MenuItem,
} from "../shared/schema";
import { hashPassword } from "./auth";

export class DatabaseStorage {
  // ============================================================================
  // USER/EMPLOYEE MANAGEMENT
  // ============================================================================

  async createUser(data: Omit<InsertUser, "password"> & { password: string }) {
    const hashedPassword = await hashPassword(data.password);
    const [user] = await db
      .insert(users)
      .values({ ...data, password: hashedPassword })
      .returning();
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);
    return user;
  }

  async getUserById(id: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users).orderBy(users.createdAt);
  }

  async getUsersByBranch(branchId: string): Promise<User[]> {
    return db
      .select()
      .from(users)
      .where(eq(users.primaryBranchId, branchId))
      .orderBy(users.role, users.firstName);
  }

  async updateUser(id: string, data: Partial<InsertUser>) {
    const [user] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async deleteUser(id: string) {
    await db.delete(users).where(eq(users.id, id));
  }

  // ============================================================================
  // TABLE MANAGEMENT
  // ============================================================================

  async createTable(data: InsertTable) {
    const [table] = await db.insert(tables).values(data).returning();
    return table;
  }

  async getTablesBySectionId(sectionId: string): Promise<Table[]> {
    return db
      .select()
      .from(tables)
      .where(and(eq(tables.sectionId, sectionId), eq(tables.isActive, true)))
      .orderBy(tables.tableNumber);
  }

  async getTableById(id: string): Promise<Table | undefined> {
    const [table] = await db
      .select()
      .from(tables)
      .where(eq(tables.id, id))
      .limit(1);
    return table;
  }

  async updateTable(id: string, data: Partial<InsertTable>) {
    const [table] = await db
      .update(tables)
      .set(data)
      .where(eq(tables.id, id))
      .returning();
    return table;
  }

  async deleteTable(id: string) {
    await db.delete(tables).where(eq(tables.id, id));
  }

  // ============================================================================
  // RESERVATION & AVAILABILITY MANAGEMENT
  // ============================================================================

  async getAvailableTables(
    sectionId: string,
    date: string,
    startTime: string,
    endTime: string,
    partySize: number
  ): Promise<Table[]> {
    // Get all active tables in the section that can accommodate the party size
    const sectionTables = await db
      .select()
      .from(tables)
      .where(
        and(
          eq(tables.sectionId, sectionId),
          eq(tables.isActive, true),
          gte(tables.maxSeats, partySize),
          lte(tables.minSeats, partySize)
        )
      );

    // Get all reservations for these tables at the requested time
    const tableIds = sectionTables.map((t) => t.id);

    if (tableIds.length === 0) {
      return [];
    }

    const conflictingReservations = await db
      .select()
      .from(reservations)
      .where(
        and(
          eq(reservations.date, date),
          sql`${reservations.tableId} = ANY(${tableIds})`,
          sql`${reservations.status} != 'cancelled'`,
          // Check for time overlap: new reservation overlaps if it starts before existing ends AND ends after existing starts
          sql`${reservations.startTime} < ${endTime}`,
          sql`${reservations.endTime} > ${startTime}`
        )
      );

    const bookedTableIds = new Set(
      conflictingReservations.map((r) => r.tableId).filter((id): id is string => id !== null)
    );

    // Return tables that are not booked
    return sectionTables.filter((table) => !bookedTableIds.has(table.id));
  }

  async getAllReservations(): Promise<Reservation[]> {
    return db
      .select()
      .from(reservations)
      .orderBy(reservations.date, reservations.startTime);
  }

  async getReservationsByDate(date: string): Promise<Reservation[]> {
    return db
      .select()
      .from(reservations)
      .where(eq(reservations.date, date))
      .orderBy(reservations.startTime);
  }

  async getReservationsByBranch(branchId: string): Promise<Reservation[]> {
    return db
      .select()
      .from(reservations)
      .where(eq(reservations.branchId, branchId))
      .orderBy(reservations.date, reservations.startTime);
  }

  async updateReservation(id: string, data: Partial<Reservation>) {
    const [reservation] = await db
      .update(reservations)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(reservations.id, id))
      .returning();
    return reservation;
  }

  // ============================================================================
  // CUSTOMER MANAGEMENT
  // ============================================================================

  async getAllCustomers() {
    return db.select().from(customers).orderBy(customers.totalVisits);
  }

  async getCustomerById(id: string) {
    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.id, id))
      .limit(1);
    return customer;
  }

  async updateCustomer(id: string, data: Partial<typeof customers.$inferInsert>) {
    const [customer] = await db
      .update(customers)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(customers.id, id))
      .returning();
    return customer;
  }

  // ============================================================================
  // FLOOR PLAN & TABLE STATUS
  // ============================================================================

  // Helper function to add hours to a time string (HH:MM format)
  private addHoursToTime(time: string, hours: number): string {
    const [h, m] = time.split(':').map(Number);
    const totalMinutes = h * 60 + m + hours * 60;
    const newHours = Math.floor(totalMinutes / 60) % 24;
    const newMinutes = totalMinutes % 60;
    return `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;
  }

  async getFloorPlanWithStatus(selectedDate?: string, selectedTime?: string) {
    // Get all sections with their tables
    const allSections = await db.select().from(sections);
    const allTables = await db.select().from(tables);
    const allBranches = await db.select().from(branches);

    // Create a map of branchId to branch for quick lookup
    const branchMap = new Map(allBranches.map(b => [b.id, b]));

    // Use provided date/time or default to current
    const checkDate = selectedDate || new Date().toISOString().split('T')[0];
    const checkTime = selectedTime || new Date().toTimeString().slice(0, 5);

    // Get active reservations for the selected date
    const dateReservations = await db
      .select()
      .from(reservations)
      .where(
        and(
          eq(reservations.date, checkDate),
          sql`${reservations.status} IN ('pending', 'confirmed', 'seated')`
        )
      );

    // Build the floor plan structure
    const floorPlan = await Promise.all(
      allSections.map(async (section) => {
        const sectionTables = allTables.filter(t => t.sectionId === section.id);

        const tablesWithStatus = sectionTables.map((table) => {
          // Check if table has any reservation that overlaps with selected time
          const conflictingReservation = dateReservations.find(r => {
            if (r.tableId !== table.id) return false;

            const resStart = r.startTime || '';
            const resEnd = r.endTime || r.startTime || '';

            // Assume selected time slot is 1 hour (can be adjusted)
            const selectedEndTime = this.addHoursToTime(checkTime, 1);

            // Check for time overlap: (start1 < end2) AND (start2 < end1)
            return (checkTime < resEnd) && (resStart < selectedEndTime);
          });

          // Determine status
          let status: 'available' | 'occupied' | 'reserved' | 'unavailable';
          let nextReservation = undefined;

          if (!table.isActive) {
            status = 'unavailable';
          } else if (conflictingReservation) {
            // Check if the reservation is currently happening (for 'occupied' status)
            const resStart = conflictingReservation.startTime || '';
            const resEnd = conflictingReservation.endTime || conflictingReservation.startTime || '';

            if (checkTime >= resStart && checkTime < resEnd && conflictingReservation.status === 'seated') {
              status = 'occupied';
            } else {
              status = 'reserved';
              nextReservation = {
                id: conflictingReservation.id,
                guestName: conflictingReservation.guestName,
                startTime: conflictingReservation.startTime,
                partySize: conflictingReservation.partySize,
              };
            }
          } else {
            status = 'available';
          }

          return {
            id: table.id,
            tableNumber: table.tableNumber,
            displayName: table.displayName || table.tableNumber,
            minSeats: table.minSeats,
            maxSeats: table.maxSeats,
            sectionId: table.sectionId,
            sectionName: section.name,
            positionX: table.positionX,
            positionY: table.positionY,
            status,
            nextReservation,
          };
        });

        const branch = branchMap.get(section.branchId);

        return {
          id: section.id,
          name: section.name,
          code: section.code,
          branchName: branch?.name || 'Unknown Branch',
          tables: tablesWithStatus,
        };
      })
    );

    return floorPlan;
  }

  // ============================================================================
  // ORDER MANAGEMENT
  // ============================================================================

  // Generate unique order number
  private generateOrderNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `ORD-${timestamp}${random}`;
  }

  // Get or create active order for a table
  async getOrCreateTableOrder(tableId: string, userId: string): Promise<Order> {
    // Check for existing active order for this table
    const [existingOrder] = await db
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.tableId, tableId),
          sql`${orders.status} IN ('pending', 'confirmed', 'preparing')`
        )
      )
      .limit(1);

    if (existingOrder) {
      return existingOrder;
    }

    // Get table details
    const [table] = await db.select().from(tables).where(eq(tables.id, tableId)).limit(1);
    if (!table) {
      throw new Error("Table not found");
    }

    // Get section details to find branchId
    const [section] = await db.select().from(sections).where(eq(sections.id, table.sectionId)).limit(1);
    if (!section) {
      throw new Error("Section not found");
    }

    // Create new order
    const [newOrder] = await db
      .insert(orders)
      .values({
        orderNumber: this.generateOrderNumber(),
        branchId: section.branchId,
        sectionId: table.sectionId,
        tableId: table.id,
        orderType: 'dine_in',
        tableNumber: table.tableNumber,
        createdByUserId: userId,
        status: 'pending',
        subtotal: 0,
        taxAmount: 0,
        totalAmount: 0,
        paymentStatus: 'pending',
      })
      .returning();

    return newOrder;
  }

  // Get order with items
  async getOrderWithItems(orderId: string) {
    const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);

    if (!order) {
      return null;
    }

    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));

    return {
      ...order,
      items,
    };
  }

  // Get active order for table
  async getActiveTableOrder(tableId: string) {
    const [order] = await db
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.tableId, tableId),
          sql`${orders.status} IN ('pending', 'confirmed', 'preparing', 'ready')`
        )
      )
      .limit(1);

    if (!order) {
      return null;
    }

    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));

    return {
      ...order,
      items,
    };
  }

  // Add item to order
  async addOrderItem(orderId: string, menuItemId: string, quantity: number = 1): Promise<OrderItem> {
    // Get menu item details
    const [menuItem] = await db.select().from(menuItems).where(eq(menuItems.id, menuItemId)).limit(1);

    if (!menuItem) {
      throw new Error("Menu item not found");
    }

    // Create order item
    const unitPrice = parseFloat(menuItem.basePrice) || 0;
    const totalPrice = unitPrice * quantity;

    const [orderItem] = await db
      .insert(orderItems)
      .values({
        orderId,
        menuItemId,
        itemName: menuItem.name,
        itemNameAr: menuItem.nameAr,
        quantity,
        unitPrice,
        totalPrice,
        status: 'pending',
        preparationStation: 'kitchen', // Default, should come from menu item
      })
      .returning();

    // Recalculate order totals
    await this.recalculateOrderTotals(orderId);

    return orderItem;
  }

  // Update order item quantity
  async updateOrderItemQuantity(orderItemId: string, quantity: number): Promise<OrderItem> {
    const [orderItem] = await db.select().from(orderItems).where(eq(orderItems.id, orderItemId)).limit(1);

    if (!orderItem) {
      throw new Error("Order item not found");
    }

    if (quantity <= 0) {
      throw new Error("Quantity must be greater than 0");
    }

    const totalPrice = orderItem.unitPrice * quantity;

    const [updated] = await db
      .update(orderItems)
      .set({
        quantity,
        totalPrice,
      })
      .where(eq(orderItems.id, orderItemId))
      .returning();

    // Recalculate order totals
    await this.recalculateOrderTotals(orderItem.orderId);

    return updated;
  }

  // Remove order item
  async removeOrderItem(orderItemId: string): Promise<void> {
    const [orderItem] = await db.select().from(orderItems).where(eq(orderItems.id, orderItemId)).limit(1);

    if (!orderItem) {
      throw new Error("Order item not found");
    }

    await db.delete(orderItems).where(eq(orderItems.id, orderItemId));

    // Recalculate order totals
    await this.recalculateOrderTotals(orderItem.orderId);
  }

  // Recalculate order totals
  private async recalculateOrderTotals(orderId: string): Promise<void> {
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));

    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
    const taxRate = 0.05; // 5% VAT
    const taxAmount = Math.round(subtotal * taxRate);
    const totalAmount = subtotal + taxAmount;

    await db
      .update(orders)
      .set({
        subtotal,
        taxAmount,
        totalAmount,
      })
      .where(eq(orders.id, orderId));
  }

  // Get all menu items
  async getAllMenuItems(): Promise<MenuItem[]> {
    const items = await db.select().from(menuItems).where(eq(menuItems.isActive, true));
    // Map basePrice to price for frontend compatibility
    return items.map(item => ({
      ...item,
      price: item.basePrice,
    })) as any;
  }

  // ============================================================================
  // MENU MANAGEMENT
  // ============================================================================

  // Get all menu categories
  async getMenuCategories() {
    return db.select().from(menuCategories).where(eq(menuCategories.isActive, true));
  }

  // Create menu item
  async createMenuItem(item: any): Promise<MenuItem> {
    const [newItem] = await db
      .insert(menuItems)
      .values({
        name: item.name,
        nameAr: item.nameAr || item.name,
        description: item.description,
        descriptionAr: item.descriptionAr || item.description,
        basePrice: item.basePrice || item.price,
        categoryId: item.categoryId || null,
        image: item.image || item.imageUrl || null,
        itemType: item.itemType || 'main',
        preparationStation: item.preparationStation || 'kitchen',
        isActive: true,
        isFeatured: item.isFeatured || false,
        isAvailable: true,
      })
      .returning();

    return newItem;
  }

  // Update menu item
  async updateMenuItem(id: string, updates: any): Promise<MenuItem> {
    const [updated] = await db
      .update(menuItems)
      .set(updates)
      .where(eq(menuItems.id, id))
      .returning();

    return updated;
  }

  // Delete menu item
  async deleteMenuItem(id: string): Promise<void> {
    await db.delete(menuItems).where(eq(menuItems.id, id));
  }

  // Get menu item by ID
  async getMenuItem(id: string): Promise<MenuItem | null> {
    const [item] = await db.select().from(menuItems).where(eq(menuItems.id, id)).limit(1);
    return item || null;
  }

  // Set branch availability for menu item
  async setMenuItemBranchAvailability(menuItemId: string, branchIds: string[]): Promise<void> {
    // Delete existing branch associations
    await db.delete(menuItemBranches).where(eq(menuItemBranches.menuItemId, menuItemId));

    // Insert new associations
    if (branchIds.length > 0) {
      await db.insert(menuItemBranches).values(
        branchIds.map(branchId => ({
          menuItemId,
          branchId,
          isAvailable: true,
        }))
      );
    }
  }

  // Get branches for menu item
  async getMenuItemBranches(menuItemId: string) {
    return db
      .select()
      .from(menuItemBranches)
      .where(eq(menuItemBranches.menuItemId, menuItemId));
  }

  // Get all branches
  async getAllBranches() {
    return db.select().from(branches);
  }
}

export const storage = new DatabaseStorage();
