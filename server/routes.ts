import type { Express } from "express";
import { storage } from "./storage";
import {
  authenticate,
  authorize,
  generateToken,
  comparePassword,
  type AuthRequest,
} from "./auth";
import { upload } from "./upload";
import { uploadMenuItemImage, deleteMenuItemImage } from "./supabase-storage";
import { verifyWebhook, handleWebhook } from "./whatsapp/webhook";
import { WhatsAppStorage } from "./whatsapp/storage";

const whatsappStorage = new WhatsAppStorage();

export function registerRoutes(app: Express) {
  // ============================================================================
  // AUTHENTICATION ROUTES
  // ============================================================================

  // Login
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res
          .status(400)
          .json({ error: "Username and password are required" });
      }

      const user = await storage.getUserByUsername(username);

      if (!user || !user.isActive) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const isValid = await comparePassword(password, user.password);

      if (!isValid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const token = generateToken(user);

      // Set HTTP-only cookie
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      // Return user data without password
      const { password: _, ...userData } = user;
      res.json({ user: userData, token });
    } catch (error: any) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Failed to login" });
    }
  });

  // Logout
  app.post("/api/auth/logout", (req, res) => {
    res.clearCookie("token");
    res.json({ message: "Logged out successfully" });
  });

  // Get current user
  app.get("/api/auth/me", authenticate, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUserById(req.user.id);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const { password: _, ...userData } = user;
      res.json(userData);
    } catch (error: any) {
      console.error("Get current user error:", error);
      res.status(500).json({ error: "Failed to get user data" });
    }
  });

  // ============================================================================
  // USER/EMPLOYEE MANAGEMENT ROUTES
  // ============================================================================

  // Get all users (admin only)
  app.get(
    "/api/users",
    authenticate,
    authorize("super_admin", "branch_manager"),
    async (req, res) => {
      try {
        const users = await storage.getAllUsers();
        // Remove passwords from response
        const sanitizedUsers = users.map(({ password, ...user }) => user);
        res.json(sanitizedUsers);
      } catch (error: any) {
        console.error("Get users error:", error);
        res.status(500).json({ error: "Failed to get users" });
      }
    }
  );

  // Get users by branch
  app.get(
    "/api/branches/:branchId/users",
    authenticate,
    authorize("super_admin", "branch_manager", "shift_supervisor"),
    async (req, res) => {
      try {
        const users = await storage.getUsersByBranch(req.params.branchId);
        const sanitizedUsers = users.map(({ password, ...user }) => user);
        res.json(sanitizedUsers);
      } catch (error: any) {
        console.error("Get branch users error:", error);
        res.status(500).json({ error: "Failed to get users" });
      }
    }
  );

  // Create user (admin only)
  app.post(
    "/api/users",
    authenticate,
    authorize("super_admin", "branch_manager"),
    async (req, res) => {
      try {
        const user = await storage.createUser(req.body);
        const { password, ...userData } = user;
        res.status(201).json(userData);
      } catch (error: any) {
        console.error("Create user error:", error);
        res.status(500).json({ error: "Failed to create user" });
      }
    }
  );

  // Update user
  app.patch(
    "/api/users/:id",
    authenticate,
    authorize("super_admin", "branch_manager"),
    async (req, res) => {
      try {
        const user = await storage.updateUser(req.params.id, req.body);
        const { password, ...userData } = user;
        res.json(userData);
      } catch (error: any) {
        console.error("Update user error:", error);
        res.status(500).json({ error: "Failed to update user" });
      }
    }
  );

  // Delete user
  app.delete(
    "/api/users/:id",
    authenticate,
    authorize("super_admin"),
    async (req, res) => {
      try {
        await storage.deleteUser(req.params.id);
        res.json({ message: "User deleted successfully" });
      } catch (error: any) {
        console.error("Delete user error:", error);
        res.status(500).json({ error: "Failed to delete user" });
      }
    }
  );

  // ============================================================================
  // TABLE MANAGEMENT ROUTES
  // ============================================================================

  // Get tables by section
  app.get(
    "/api/sections/:sectionId/tables",
    authenticate,
    async (req, res) => {
      try {
        const tables = await storage.getTablesBySectionId(req.params.sectionId);
        res.json(tables);
      } catch (error: any) {
        console.error("Get tables error:", error);
        res.status(500).json({ error: "Failed to get tables" });
      }
    }
  );

  // Create table
  app.post(
    "/api/tables",
    authenticate,
    authorize("super_admin", "branch_manager"),
    async (req, res) => {
      try {
        const table = await storage.createTable(req.body);
        res.status(201).json(table);
      } catch (error: any) {
        console.error("Create table error:", error);
        res.status(500).json({ error: "Failed to create table" });
      }
    }
  );

  // Update table
  app.patch(
    "/api/tables/:id",
    authenticate,
    authorize("super_admin", "branch_manager"),
    async (req, res) => {
      try {
        const table = await storage.updateTable(req.params.id, req.body);
        res.json(table);
      } catch (error: any) {
        console.error("Update table error:", error);
        res.status(500).json({ error: "Failed to update table" });
      }
    }
  );

  // Delete table
  app.delete(
    "/api/tables/:id",
    authenticate,
    authorize("super_admin", "branch_manager"),
    async (req, res) => {
      try {
        await storage.deleteTable(req.params.id);
        res.json({ message: "Table deleted successfully" });
      } catch (error: any) {
        console.error("Delete table error:", error);
        res.status(500).json({ error: "Failed to delete table" });
      }
    }
  );

  // Check table availability
  app.post("/api/tables/check-availability", async (req, res) => {
    try {
      const { sectionId, date, startTime, endTime, partySize } = req.body;

      if (!sectionId || !date || !startTime || !endTime || !partySize) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const availableTables = await storage.getAvailableTables(
        sectionId,
        date,
        startTime,
        endTime,
        partySize
      );

      res.json({
        available: availableTables.length > 0,
        tables: availableTables,
        count: availableTables.length,
      });
    } catch (error: any) {
      console.error("Check availability error:", error);
      res.status(500).json({ error: "Failed to check availability" });
    }
  });

  // Get floor plan with table occupancy status
  app.get("/api/tables/floor-plan", authenticate, async (req, res) => {
    try {
      const date = req.query.date as string || new Date().toISOString().split('T')[0];
      const time = req.query.time as string || new Date().toTimeString().slice(0, 5);

      const floorPlan = await storage.getFloorPlanWithStatus(date, time);
      res.json(floorPlan);
    } catch (error: any) {
      console.error("Get floor plan error:", error);
      res.status(500).json({ error: "Failed to get floor plan" });
    }
  });

  // ============================================================================
  // RESERVATION MANAGEMENT ROUTES
  // ============================================================================

  // Get all reservations
  app.get("/api/reservations", authenticate, async (req, res) => {
    try {
      const reservations = await storage.getAllReservations();
      res.json(reservations);
    } catch (error: any) {
      console.error("Get reservations error:", error);
      res.status(500).json({ error: "Failed to get reservations" });
    }
  });

  // Get reservations by date
  app.get("/api/reservations/date/:date", authenticate, async (req, res) => {
    try {
      const reservations = await storage.getReservationsByDate(req.params.date);
      res.json(reservations);
    } catch (error: any) {
      console.error("Get reservations by date error:", error);
      res.status(500).json({ error: "Failed to get reservations" });
    }
  });

  // Get reservations by branch
  app.get(
    "/api/branches/:branchId/reservations",
    authenticate,
    async (req, res) => {
      try {
        const reservations = await storage.getReservationsByBranch(
          req.params.branchId
        );
        res.json(reservations);
      } catch (error: any) {
        console.error("Get branch reservations error:", error);
        res.status(500).json({ error: "Failed to get reservations" });
      }
    }
  );

  // Update reservation status
  app.patch("/api/reservations/:id", authenticate, async (req, res) => {
    try {
      const reservation = await storage.updateReservation(
        req.params.id,
        req.body
      );
      res.json(reservation);
    } catch (error: any) {
      console.error("Update reservation error:", error);
      res.status(500).json({ error: "Failed to update reservation" });
    }
  });

  // Checkout/Complete a reservation
  app.post("/api/reservations/:id/checkout", authenticate, async (req, res) => {
    try {
      const reservation = await storage.updateReservation(
        req.params.id,
        { status: 'completed' }
      );

      if (!reservation) {
        return res.status(404).json({ error: "Reservation not found" });
      }

      res.json({
        success: true,
        message: "Guest checked out successfully",
        reservation
      });
    } catch (error: any) {
      console.error("Checkout reservation error:", error);
      res.status(500).json({ error: "Failed to checkout reservation" });
    }
  });

  // ============================================================================
  // CUSTOMER MANAGEMENT ROUTES
  // ============================================================================

  // Get all customers
  app.get("/api/customers", authenticate, async (req, res) => {
    try {
      const customers = await storage.getAllCustomers();
      res.json(customers);
    } catch (error: any) {
      console.error("Get customers error:", error);
      res.status(500).json({ error: "Failed to get customers" });
    }
  });

  // Get customer by ID
  app.get("/api/customers/:id", authenticate, async (req, res) => {
    try {
      const customer = await storage.getCustomerById(req.params.id);
      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }
      res.json(customer);
    } catch (error: any) {
      console.error("Get customer error:", error);
      res.status(500).json({ error: "Failed to get customer" });
    }
  });

  // Update customer
  app.patch("/api/customers/:id", authenticate, async (req, res) => {
    try {
      const customer = await storage.updateCustomer(req.params.id, req.body);
      res.json(customer);
    } catch (error: any) {
      console.error("Update customer error:", error);
      res.status(500).json({ error: "Failed to update customer" });
    }
  });

  // ============================================================================
  // ORDER MANAGEMENT ROUTES
  // ============================================================================

  // Get or create order for table
  app.post("/api/tables/:tableId/order", authenticate, async (req, res) => {
    try {
      const order = await storage.getOrCreateTableOrder(req.params.tableId, req.user!.id);
      res.json(order);
    } catch (error: any) {
      console.error("Get/create table order error:", error);
      res.status(500).json({ error: error.message || "Failed to get/create order" });
    }
  });

  // Get active order for table
  app.get("/api/tables/:tableId/order", authenticate, async (req, res) => {
    try {
      const order = await storage.getActiveTableOrder(req.params.tableId);
      if (!order) {
        return res.status(404).json({ error: "No active order found for this table" });
      }
      res.json(order);
    } catch (error: any) {
      console.error("Get table order error:", error);
      res.status(500).json({ error: "Failed to get order" });
    }
  });

  // Add item to order
  app.post("/api/orders/:orderId/items", authenticate, async (req, res) => {
    try {
      const { menuItemId, quantity } = req.body;

      if (!menuItemId) {
        return res.status(400).json({ error: "Menu item ID is required" });
      }

      const orderItem = await storage.addOrderItem(
        req.params.orderId,
        menuItemId,
        quantity || 1
      );

      // Get updated order with totals
      const order = await storage.getOrderWithItems(req.params.orderId);

      res.json({ orderItem, order });
    } catch (error: any) {
      console.error("Add order item error:", error);
      res.status(500).json({ error: error.message || "Failed to add item" });
    }
  });

  // Update order item quantity
  app.patch("/api/orders/:orderId/items/:itemId", authenticate, async (req, res) => {
    try {
      const { quantity } = req.body;

      if (!quantity || quantity < 1) {
        return res.status(400).json({ error: "Valid quantity is required" });
      }

      await storage.updateOrderItemQuantity(req.params.itemId, quantity);

      // Get updated order
      const order = await storage.getOrderWithItems(req.params.orderId);

      res.json({ success: true, order });
    } catch (error: any) {
      console.error("Update order item error:", error);
      res.status(500).json({ error: error.message || "Failed to update item" });
    }
  });

  // Remove item from order
  app.delete("/api/orders/:orderId/items/:itemId", authenticate, async (req, res) => {
    try {
      await storage.removeOrderItem(req.params.itemId);

      // Get updated order
      const order = await storage.getOrderWithItems(req.params.orderId);

      res.json({ success: true, order });
    } catch (error: any) {
      console.error("Remove order item error:", error);
      res.status(500).json({ error: error.message || "Failed to remove item" });
    }
  });

  // Get all menu items
  app.get("/api/menu-items", authenticate, async (req, res) => {
    try {
      const items = await storage.getAllMenuItems();
      // Map database fields to frontend-expected fields
      const mappedItems = items.map(item => ({
        ...item,
        imageUrl: item.image,
        price: parseFloat(item.basePrice),
      }));
      res.json(mappedItems);
    } catch (error: any) {
      console.error("Get menu items error:", error);
      res.json({ error: "Failed to get menu items" });
    }
  });

  // ============================================================================
  // MENU MANAGEMENT ROUTES
  // ============================================================================

  // Get menu categories
  app.get("/api/menu/categories", authenticate, async (req, res) => {
    try {
      const categories = await storage.getMenuCategories();
      res.json(categories);
    } catch (error: any) {
      console.error("Get categories error:", error);
      res.status(500).json({ error: "Failed to get categories" });
    }
  });

  // Get single menu item
  app.get("/api/menu/:id", authenticate, async (req, res) => {
    try {
      const item = await storage.getMenuItem(req.params.id);
      if (!item) {
        return res.status(404).json({ error: "Menu item not found" });
      }

      // Get branch associations
      const branchAssociations = await storage.getMenuItemBranches(req.params.id);

      res.json({
        ...item,
        imageUrl: item.image,
        price: parseFloat(item.basePrice),
        branches: branchAssociations.map(b => b.branchId),
      });
    } catch (error: any) {
      console.error("Get menu item error:", error);
      res.status(500).json({ error: "Failed to get menu item" });
    }
  });

  // Upload menu item image
  app.post("/api/menu/upload-image", authenticate, upload.single('image'), async (req, res) => {
    try {
      // Check if file was uploaded
      if (!req.file) {
        return res.status(400).json({ error: 'No image file provided' });
      }

      // Get item name from request
      const { itemName } = req.body;
      if (!itemName) {
        return res.status(400).json({ error: 'Item name is required' });
      }

      // Extract file extension
      const fileExt = req.file.originalname.split('.').pop()?.toLowerCase() || 'jpg';

      // Upload to Supabase Storage
      const filename = await uploadMenuItemImage(req.file.buffer, itemName, fileExt);

      // Return the filename to save in database
      res.json({ filename });
    } catch (error: any) {
      console.error('Image upload error:', error);
      res.status(500).json({ error: error.message || 'Failed to upload image' });
    }
  });

  // Create menu item
  app.post("/api/menu", authenticate, async (req, res) => {
    try {
      const { branches, imageUrl, price, ...itemData } = req.body;

      // Map frontend fields to database fields
      const dataToSave = {
        ...itemData,
        image: imageUrl || null,
        basePrice: price,
      };

      // Create menu item
      const item = await storage.createMenuItem(dataToSave);

      // Set branch availability
      if (branches && branches.length > 0) {
        await storage.setMenuItemBranchAvailability(item.id, branches);
      }

      // Map database fields back to frontend format
      res.status(201).json({
        ...item,
        imageUrl: item.image,
        price: parseFloat(item.basePrice),
      });
    } catch (error: any) {
      console.error("Create menu item error:", error);
      res.status(500).json({ error: "Failed to create menu item" });
    }
  });

  // Update menu item
  app.patch("/api/menu/:id", authenticate, async (req, res) => {
    try {
      const { branches, imageUrl, price, ...updates } = req.body;

      // Get the current menu item to check for old image
      const currentItem = await storage.getMenuItem(req.params.id);

      // Map imageUrl to image for database
      if (imageUrl !== undefined) {
        updates.image = imageUrl || null;

        // Delete old image if it exists and is different from new one
        if (currentItem?.image && currentItem.image !== imageUrl && imageUrl) {
          try {
            await deleteMenuItemImage(currentItem.image);
          } catch (error) {
            console.error('Failed to delete old image:', error);
            // Continue anyway, don't fail the update
          }
        }
      }

      // Map price to basePrice for database
      if (price !== undefined) {
        updates.basePrice = price;
      }

      // Convert empty string categoryId to null
      if (updates.categoryId === '') {
        updates.categoryId = null;
      }

      // Update menu item
      const item = await storage.updateMenuItem(req.params.id, updates);

      // Update branch availability if provided
      if (branches !== undefined) {
        await storage.setMenuItemBranchAvailability(req.params.id, branches);
      }

      // Map database fields back to frontend format
      res.json({
        ...item,
        imageUrl: item.image,
        price: parseFloat(item.basePrice),
      });
    } catch (error: any) {
      console.error("Update menu item error:", error);
      res.status(500).json({ error: "Failed to update menu item" });
    }
  });

  // Delete menu item
  app.delete("/api/menu/:id", authenticate, async (req, res) => {
    try {
      await storage.deleteMenuItem(req.params.id);
      res.json({ success: true, message: "Menu item deleted successfully" });
    } catch (error: any) {
      console.error("Delete menu item error:", error);
      res.status(500).json({ error: "Failed to delete menu item" });
    }
  });

  // Get all branches
  app.get("/api/branches-list", authenticate, async (req, res) => {
    try {
      const branches = await storage.getAllBranches();
      res.json(branches);
    } catch (error: any) {
      console.error("Get branches error:", error);
      res.status(500).json({ error: "Failed to get branches" });
    }
  });

  // ============================================================================
  // WHATSAPP BOT ROUTES
  // ============================================================================

  // Webhook verification (required by Meta)
  app.get("/api/whatsapp/webhook", verifyWebhook);

  // Webhook handler (receive messages)
  app.post("/api/whatsapp/webhook", handleWebhook);

  // Get conversations for CRM UI
  app.get("/api/whatsapp/conversations", authenticate, async (req, res) => {
    try {
      const status = req.query.status as string | undefined;
      const assignedToUserId = req.query.assignedToUserId as string | undefined;

      const conversations = await whatsappStorage.getConversationsForCRM({
        status,
        assignedToUserId,
        limit: 50,
      });

      res.json(conversations);
    } catch (error: any) {
      console.error("Get WhatsApp conversations error:", error);
      res.status(500).json({ error: "Failed to get conversations" });
    }
  });

  // Get single conversation with messages
  app.get("/api/whatsapp/conversations/:id", authenticate, async (req, res) => {
    try {
      const conversation = await whatsappStorage.getConversationById(req.params.id);

      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }

      const messages = await whatsappStorage.getConversationMessages(req.params.id);

      res.json({
        conversation,
        messages,
      });
    } catch (error: any) {
      console.error("Get conversation error:", error);
      res.status(500).json({ error: "Failed to get conversation" });
    }
  });

  // Take over conversation (human takeover)
  app.post("/api/whatsapp/conversations/:id/takeover", authenticate, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const conversation = await whatsappStorage.getConversationById(req.params.id);

      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }

      await whatsappStorage.updateConversationStatus(
        req.params.id,
        'waiting_human',
        req.user.id
      );

      res.json({ success: true, message: "Conversation assigned to you" });
    } catch (error: any) {
      console.error("Takeover conversation error:", error);
      res.status(500).json({ error: "Failed to take over conversation" });
    }
  });

  // Send message (staff reply)
  app.post("/api/whatsapp/conversations/:id/message", authenticate, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { message } = req.body;

      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      const conversation = await whatsappStorage.getConversationById(req.params.id);

      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }

      // Get WhatsApp customer
      const customer = await whatsappStorage.getWhatsAppCustomerByPhone(
        conversation.whatsappCustomerId
      );

      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }

      // Send message via WhatsApp API
      const { sendTextMessage, getWhatsAppConfig } = await import("./whatsapp/sender");
      const config = getWhatsAppConfig();

      const result = await sendTextMessage(config, customer.phoneNumber, message);

      // Store message
      await whatsappStorage.saveMessage({
        conversationId: req.params.id,
        whatsappMessageId: result.messages[0].id,
        direction: 'outbound',
        type: 'text',
        content: JSON.stringify({ text: message }),
        senderType: 'staff',
        sentByUserId: req.user.id,
      });

      res.json({ success: true, message: "Message sent" });
    } catch (error: any) {
      console.error("Send message error:", error);
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  // Get WhatsApp analytics/stats
  app.get("/api/whatsapp/stats", authenticate, async (req, res) => {
    try {
      const stats = await whatsappStorage.getMessageStats();
      const activeConversations = await whatsappStorage.getActiveConversationsCount();

      res.json({
        ...stats,
        activeConversations,
      });
    } catch (error: any) {
      console.error("Get WhatsApp stats error:", error);
      res.status(500).json({ error: "Failed to get stats" });
    }
  });
}
