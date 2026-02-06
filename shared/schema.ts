import { sql } from "drizzle-orm";
import { pgSchema, pgEnum, text, varchar, integer, boolean, timestamp, decimal, date, time, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Define the PostgreSQL schema
export const hadootaSchema = pgSchema("Hadoota_Masreya_Manager");
export const whatsappSchema = pgSchema("WhatsApp_Manager");

// ============================================================================
// ENUMS
// ============================================================================

export const userRoleEnum = pgEnum("user_role", [
  "super_admin",
  "branch_manager",
  "shift_supervisor",
  "cashier",
  "kitchen_staff",
  "bar_staff",
  "shisha_staff",
  "cafe_staff",
  "waiter"
]);

export const smokingPolicyEnum = pgEnum("smoking_policy", [
  "smoking_allowed",
  "non_smoking",
  "shisha_only"
]);

export const preparationStationEnum = pgEnum("preparation_station", [
  "kitchen",
  "bar",
  "cafe",
  "shisha"
]);

export const mealPeriodEnum = pgEnum("meal_period", [
  "breakfast",
  "lunch",
  "dinner",
  "all_day"
]);

export const menuItemTypeEnum = pgEnum("menu_item_type", [
  "main",
  "add_on",
  "modifier"
]);

export const orderTypeEnum = pgEnum("order_type", [
  "dine_in",
  "takeaway"
]);

export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "served",
  "completed",
  "cancelled",
  "voided"
]);

export const orderItemStatusEnum = pgEnum("order_item_status", [
  "pending",
  "sent_to_station",
  "preparing",
  "ready",
  "served",
  "cancelled"
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "partial",
  "paid",
  "refunded"
]);

export const paymentMethodEnum = pgEnum("payment_method", [
  "cash",
  "card",
  "apple_pay",
  "google_pay",
  "split"
]);

export const reservationStatusEnum = pgEnum("reservation_status", [
  "pending",
  "confirmed",
  "seated",
  "completed",
  "no_show",
  "cancelled"
]);

// ============================================================================
// CORE LOCATION TABLES
// ============================================================================

// Branches (replaces old locations table)
export const branches = hadootaSchema.table("branches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),

  // Basic Info
  name: text("name").notNull(),
  nameAr: text("name_ar").notNull(),
  code: varchar("code", { length: 10 }).notNull().unique(),

  // Location
  address: text("address").notNull(),
  addressAr: text("address_ar"),
  city: text("city").notNull().default("Dubai"),
  mapUrl: text("map_url"),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),

  // Contact
  phone: text("phone").notNull(),
  email: text("email"),
  whatsapp: text("whatsapp"),

  // Operations
  openingTime: time("opening_time").notNull().default("12:00"),
  closingTime: time("closing_time").notNull().default("02:00"),
  timezone: text("timezone").notNull().default("Asia/Dubai"),

  // Status
  isActive: boolean("is_active").notNull().default(true),
  isAcceptingOrders: boolean("is_accepting_orders").notNull().default(true),
  isAcceptingReservations: boolean("is_accepting_reservations").notNull().default(true),

  // Metadata
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Sections within branches
export const sections = hadootaSchema.table("sections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  branchId: varchar("branch_id").notNull().references(() => branches.id, { onDelete: "cascade" }),

  // Basic Info
  name: text("name").notNull(),
  nameAr: text("name_ar").notNull(),
  code: varchar("code", { length: 20 }).notNull(),
  description: text("description"),
  descriptionAr: text("description_ar"),

  // Capacity
  totalCapacity: integer("total_capacity").notNull().default(50),
  tableCount: integer("table_count").notNull().default(10),

  // Rules
  smokingPolicy: smokingPolicyEnum("smoking_policy").notNull(),
  minPartySize: integer("min_party_size").notNull().default(1),
  maxPartySize: integer("max_party_size").notNull().default(20),

  // Availability
  isActive: boolean("is_active").notNull().default(true),
  reservationDurationMinutes: integer("reservation_duration_minutes").default(120),

  // Display
  sortOrder: integer("sort_order").notNull().default(0),
  floorPlanImage: text("floor_plan_image"),

  // Metadata
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Physical tables in sections
export const tables = hadootaSchema.table("tables", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sectionId: varchar("section_id").notNull().references(() => sections.id, { onDelete: "cascade" }),

  // Identity
  tableNumber: varchar("table_number", { length: 10 }).notNull(),
  displayName: text("display_name"),
  displayNameAr: text("display_name_ar"),

  // Capacity
  minSeats: integer("min_seats").notNull().default(2),
  maxSeats: integer("max_seats").notNull().default(4),

  // Status
  isActive: boolean("is_active").notNull().default(true),

  // Position (for floor plan)
  positionX: integer("position_x"),
  positionY: integer("position_y"),

  createdAt: timestamp("created_at").defaultNow(),
});

// ============================================================================
// MENU SYSTEM
// ============================================================================

// Menu categories (hierarchical)
export const menuCategories = hadootaSchema.table("menu_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),

  name: text("name").notNull(),
  nameAr: text("name_ar").notNull(),
  description: text("description"),
  descriptionAr: text("description_ar"),

  parentId: varchar("parent_id"),

  sortOrder: integer("sort_order").notNull().default(0),
  image: text("image"),
  isActive: boolean("is_active").notNull().default(true),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Menu items (enhanced)
export const menuItems = hadootaSchema.table("menu_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),

  // Basic Info
  name: text("name").notNull(),
  nameAr: text("name_ar").notNull(),
  description: text("description").notNull(),
  descriptionAr: text("description_ar"),

  // Categorization
  categoryId: varchar("category_id").references(() => menuCategories.id, { onDelete: "set null" }),
  itemType: menuItemTypeEnum("item_type").notNull().default("main"),

  // Pricing
  basePrice: decimal("base_price", { precision: 10, scale: 2 }).notNull(),
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).default("5.00"),

  // Preparation
  preparationStation: preparationStationEnum("preparation_station").notNull().default("kitchen"),
  preparationTimeMinutes: integer("preparation_time_minutes").default(15),

  // Availability - stored as JSON string for meal periods
  mealPeriods: text("meal_periods").notNull().default("all_day"),

  // Dietary Info (stored as JSON for flexibility)
  allergens: text("allergens"),
  dietaryFlags: text("dietary_flags"),
  spiceLevel: integer("spice_level").default(0),
  calories: integer("calories"),

  // Display
  image: text("image"),
  isFeatured: boolean("is_featured").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),

  // Status
  isActive: boolean("is_active").notNull().default(true),
  isAvailable: boolean("is_available").notNull().default(true),

  // SKU for inventory
  sku: varchar("sku", { length: 50 }),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Menu item availability per branch
export const menuItemBranches = hadootaSchema.table("menu_item_branches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  menuItemId: varchar("menu_item_id").notNull().references(() => menuItems.id, { onDelete: "cascade" }),
  branchId: varchar("branch_id").notNull().references(() => branches.id, { onDelete: "cascade" }),

  // Branch-specific overrides
  priceOverride: integer("price_override"),
  isAvailable: boolean("is_available").notNull().default(true),

  createdAt: timestamp("created_at").defaultNow(),
});

// Menu item availability per section (e.g., no shisha in non-smoking)
export const menuItemSections = hadootaSchema.table("menu_item_sections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  menuItemId: varchar("menu_item_id").notNull().references(() => menuItems.id, { onDelete: "cascade" }),
  sectionId: varchar("section_id").notNull().references(() => sections.id, { onDelete: "cascade" }),

  isAvailable: boolean("is_available").notNull().default(true),

  createdAt: timestamp("created_at").defaultNow(),
});

// Add-on relationships (shisha -> refill, main -> side)
export const menuItemAddOns = hadootaSchema.table("menu_item_add_ons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),

  parentItemId: varchar("parent_item_id").notNull().references(() => menuItems.id, { onDelete: "cascade" }),
  addOnItemId: varchar("add_on_item_id").notNull().references(() => menuItems.id, { onDelete: "cascade" }),

  isRequired: boolean("is_required").notNull().default(false),
  maxQuantity: integer("max_quantity").default(5),
  sortOrder: integer("sort_order").notNull().default(0),

  createdAt: timestamp("created_at").defaultNow(),
});

// Modifier groups ("Choose your sauce", "Select size")
export const modifierGroups = hadootaSchema.table("modifier_groups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),

  name: text("name").notNull(),
  nameAr: text("name_ar").notNull(),

  minSelections: integer("min_selections").notNull().default(0),
  maxSelections: integer("max_selections").notNull().default(1),

  isActive: boolean("is_active").notNull().default(true),

  createdAt: timestamp("created_at").defaultNow(),
});

// Links menu items to modifier groups
export const menuItemModifierGroups = hadootaSchema.table("menu_item_modifier_groups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  menuItemId: varchar("menu_item_id").notNull().references(() => menuItems.id, { onDelete: "cascade" }),
  modifierGroupId: varchar("modifier_group_id").notNull().references(() => modifierGroups.id, { onDelete: "cascade" }),

  sortOrder: integer("sort_order").notNull().default(0),

  createdAt: timestamp("created_at").defaultNow(),
});

// Options within modifier groups
export const modifierGroupOptions = hadootaSchema.table("modifier_group_options", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  modifierGroupId: varchar("modifier_group_id").notNull().references(() => modifierGroups.id, { onDelete: "cascade" }),

  name: text("name").notNull(),
  nameAr: text("name_ar").notNull(),

  priceAdjustment: integer("price_adjustment").notNull().default(0),

  isDefault: boolean("is_default").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),

  createdAt: timestamp("created_at").defaultNow(),
});

// ============================================================================
// CUSTOMER SYSTEM
// ============================================================================

// Customers (auto-created from phone/email)
export const customers = hadootaSchema.table("customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),

  // Identity
  phone: varchar("phone", { length: 20 }).notNull().unique(),
  email: text("email").unique(),

  // Profile
  firstName: text("first_name"),
  firstNameAr: text("first_name_ar"),
  lastName: text("last_name"),
  lastNameAr: text("last_name_ar"),

  // Preferences
  preferredLanguage: varchar("preferred_language", { length: 5 }).default("en"),
  preferredBranchId: varchar("preferred_branch_id").references(() => branches.id, { onDelete: "set null" }),
  preferredSectionId: varchar("preferred_section_id").references(() => sections.id, { onDelete: "set null" }),
  smokingPreference: smokingPolicyEnum("smoking_preference"),

  // Dietary preferences (JSON)
  dietaryPreferences: text("dietary_preferences"),

  // Statistics (denormalized for performance)
  totalVisits: integer("total_visits").notNull().default(0),
  totalSpent: integer("total_spent").notNull().default(0),
  averageSpent: integer("average_spent").notNull().default(0),
  lastVisitAt: timestamp("last_visit_at"),

  // Marketing
  marketingOptIn: boolean("marketing_opt_in").notNull().default(false),
  birthdayMonth: integer("birthday_month"),
  birthdayDay: integer("birthday_day"),

  // Notes
  internalNotes: text("internal_notes"),

  // Status
  isVip: boolean("is_vip").notNull().default(false),
  isBlacklisted: boolean("is_blacklisted").notNull().default(false),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Customer frequent items
export const customerFrequentItems = hadootaSchema.table("customer_frequent_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
  menuItemId: varchar("menu_item_id").notNull().references(() => menuItems.id, { onDelete: "cascade" }),

  orderCount: integer("order_count").notNull().default(1),
  lastOrderedAt: timestamp("last_ordered_at").defaultNow(),

  createdAt: timestamp("created_at").defaultNow(),
});

// ============================================================================
// USER & PERMISSION SYSTEM
// ============================================================================

// Users (enhanced with roles)
export const users = hadootaSchema.table("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),

  // Authentication
  username: text("username").notNull().unique(),
  password: text("password").notNull(),

  // Profile
  firstName: text("first_name").notNull().default(""),
  firstNameAr: text("first_name_ar"),
  lastName: text("last_name").notNull().default(""),
  lastNameAr: text("last_name_ar"),
  email: text("email").unique(),
  phone: text("phone"),

  // Role
  role: userRoleEnum("role").notNull().default("waiter"),

  // Branch Assignment (null for super_admin = all branches)
  primaryBranchId: varchar("primary_branch_id").references(() => branches.id, { onDelete: "set null" }),

  // Status
  isActive: boolean("is_active").notNull().default(true),
  lastLoginAt: timestamp("last_login_at"),

  // PIN for quick station access
  pin: varchar("pin", { length: 6 }),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Staff assigned to multiple branches
export const userBranches = hadootaSchema.table("user_branches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  branchId: varchar("branch_id").notNull().references(() => branches.id, { onDelete: "cascade" }),

  createdAt: timestamp("created_at").defaultNow(),
});

// Role permissions mapping
export const rolePermissions = hadootaSchema.table("role_permissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  role: userRoleEnum("role").notNull(),
  permission: text("permission").notNull(),

  createdAt: timestamp("created_at").defaultNow(),
});

// ============================================================================
// ORDER SYSTEM
// ============================================================================

// Orders
export const orders = hadootaSchema.table("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),

  // Order number (human readable)
  orderNumber: varchar("order_number", { length: 20 }).notNull().unique(),

  // Location
  branchId: varchar("branch_id").notNull().references(() => branches.id),
  sectionId: varchar("section_id").references(() => sections.id),
  tableId: varchar("table_id").references(() => tables.id),

  // Type
  orderType: orderTypeEnum("order_type").notNull(),
  tableNumber: varchar("table_number", { length: 10 }),

  // Customer
  customerId: varchar("customer_id").references(() => customers.id, { onDelete: "set null" }),
  customerName: text("customer_name"),
  customerPhone: text("customer_phone"),

  // Staff
  createdByUserId: varchar("created_by_user_id").notNull().references(() => users.id),
  assignedWaiterId: varchar("assigned_waiter_id").references(() => users.id),

  // Status
  status: orderStatusEnum("status").notNull().default("pending"),

  // Timing
  createdAt: timestamp("created_at").defaultNow(),
  confirmedAt: timestamp("confirmed_at"),
  completedAt: timestamp("completed_at"),

  // Financials
  subtotal: integer("subtotal").notNull().default(0),
  taxAmount: integer("tax_amount").notNull().default(0),
  discountAmount: integer("discount_amount").notNull().default(0),
  totalAmount: integer("total_amount").notNull().default(0),

  // Payment
  paymentStatus: paymentStatusEnum("payment_status").notNull().default("pending"),
  paymentMethod: paymentMethodEnum("payment_method"),
  paidAt: timestamp("paid_at"),

  // Notes
  notes: text("notes"),
  internalNotes: text("internal_notes"),

  // Linked reservation
  reservationId: varchar("reservation_id"),

  updatedAt: timestamp("updated_at").defaultNow(),
});

// Order items
export const orderItems = hadootaSchema.table("order_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  menuItemId: varchar("menu_item_id").notNull().references(() => menuItems.id),

  // Parent item (for add-ons)
  parentOrderItemId: varchar("parent_order_item_id"),

  // Item details (snapshot at time of order)
  itemName: text("item_name").notNull(),
  itemNameAr: text("item_name_ar"),

  // Quantity & pricing
  quantity: integer("quantity").notNull().default(1),
  unitPrice: integer("unit_price").notNull(),
  totalPrice: integer("total_price").notNull(),

  // Modifiers applied (JSON snapshot)
  modifiers: text("modifiers"),

  // Status & routing
  status: orderItemStatusEnum("status").notNull().default("pending"),
  preparationStation: preparationStationEnum("preparation_station").notNull(),

  // Timing
  sentToStationAt: timestamp("sent_to_station_at"),
  readyAt: timestamp("ready_at"),
  servedAt: timestamp("served_at"),

  // Notes
  notes: text("notes"),

  createdAt: timestamp("created_at").defaultNow(),
});

// Station queue for kitchen/bar displays
export const stationQueue = hadootaSchema.table("station_queue", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderItemId: varchar("order_item_id").notNull().references(() => orderItems.id, { onDelete: "cascade" }),
  branchId: varchar("branch_id").notNull().references(() => branches.id),
  station: preparationStationEnum("station").notNull(),

  priority: integer("priority").notNull().default(0),
  estimatedReadyAt: timestamp("estimated_ready_at"),

  createdAt: timestamp("created_at").defaultNow(),
});

// ============================================================================
// RESERVATION SYSTEM
// ============================================================================

// Reservations (enhanced)
export const reservations = hadootaSchema.table("reservations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),

  // Confirmation number (human readable)
  confirmationNumber: varchar("confirmation_number", { length: 20 }).notNull().unique(),

  // Location
  branchId: varchar("branch_id").notNull().references(() => branches.id),
  sectionId: varchar("section_id").notNull().references(() => sections.id),
  tableId: varchar("table_id").references(() => tables.id),

  // Customer
  customerId: varchar("customer_id").references(() => customers.id, { onDelete: "set null" }),

  // Guest info (for non-registered or override)
  guestName: text("guest_name").notNull(),
  guestEmail: text("guest_email").notNull(),
  guestPhone: text("guest_phone").notNull(),

  // Reservation details
  date: date("date").notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  partySize: integer("party_size").notNull(),

  // Preferences
  smokingPreference: smokingPolicyEnum("smoking_preference"),
  specialRequests: text("special_requests"),
  occasion: text("occasion"),

  // Status
  status: reservationStatusEnum("status").notNull().default("pending"),

  // Staff
  createdByUserId: varchar("created_by_user_id").references(() => users.id),
  confirmedByUserId: varchar("confirmed_by_user_id").references(() => users.id),

  // Timing
  createdAt: timestamp("created_at").defaultNow(),
  confirmedAt: timestamp("confirmed_at"),
  seatedAt: timestamp("seated_at"),
  completedAt: timestamp("completed_at"),

  // Linked order
  orderId: varchar("order_id"),

  // Source
  source: text("source").default("website"),

  // Internal
  internalNotes: text("internal_notes"),

  updatedAt: timestamp("updated_at").defaultNow(),
});

// Section time slots for capacity management
export const sectionTimeSlots = hadootaSchema.table("section_time_slots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sectionId: varchar("section_id").notNull().references(() => sections.id, { onDelete: "cascade" }),

  date: date("date").notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),

  // Capacity tracking
  totalCapacity: integer("total_capacity").notNull(),
  reservedCapacity: integer("reserved_capacity").notNull().default(0),
  availableCapacity: integer("available_capacity").notNull(),

  // Status
  isBlocked: boolean("is_blocked").notNull().default(false),
  blockReason: text("block_reason"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ============================================================================
// EVENTS SYSTEM
// ============================================================================

// Events (enhanced)
export const events = hadootaSchema.table("events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),

  // Basic Info
  title: text("title").notNull(),
  titleAr: text("title_ar"),
  description: text("description").notNull(),
  descriptionAr: text("description_ar"),

  // Schedule
  eventType: text("event_type").notNull().default("recurring"),
  dayOfWeek: text("day_of_week"),
  specificDate: date("specific_date"),
  startTime: time("start_time").notNull(),
  endTime: time("end_time"),

  // Display
  image: text("image"),
  isActive: boolean("is_active").notNull().default(true),
  isFeatured: boolean("is_featured").notNull().default(false),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Events at specific branches
export const eventBranches = hadootaSchema.table("event_branches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  branchId: varchar("branch_id").notNull().references(() => branches.id, { onDelete: "cascade" }),

  startTimeOverride: time("start_time_override"),
  endTimeOverride: time("end_time_override"),

  createdAt: timestamp("created_at").defaultNow(),
});

// Events in specific sections
export const eventSections = hadootaSchema.table("event_sections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  sectionId: varchar("section_id").notNull().references(() => sections.id, { onDelete: "cascade" }),

  createdAt: timestamp("created_at").defaultNow(),
});

// ============================================================================
// FEEDBACK SYSTEM
// ============================================================================

// Feedback (enhanced)
export const feedback = hadootaSchema.table("feedback", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),

  // Source
  branchId: varchar("branch_id").references(() => branches.id, { onDelete: "set null" }),
  orderId: varchar("order_id").references(() => orders.id, { onDelete: "set null" }),
  reservationId: varchar("reservation_id").references(() => reservations.id, { onDelete: "set null" }),
  customerId: varchar("customer_id").references(() => customers.id, { onDelete: "set null" }),

  // Guest info (if not linked to customer)
  guestName: text("guest_name"),
  guestEmail: text("guest_email"),
  guestPhone: text("guest_phone"),

  // Ratings (1-5)
  overallRating: integer("overall_rating"),
  foodRating: integer("food_rating"),
  serviceRating: integer("service_rating"),
  ambianceRating: integer("ambiance_rating"),
  valueRating: integer("value_rating"),

  // Feedback
  message: text("message"),

  // Response
  isResolved: boolean("is_resolved").notNull().default(false),
  resolvedByUserId: varchar("resolved_by_user_id").references(() => users.id),
  resolvedAt: timestamp("resolved_at"),
  responseMessage: text("response_message"),

  // Source
  source: text("source").default("website"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ============================================================================
// WHATSAPP BOT SYSTEM
// ============================================================================

// Enums for WhatsApp
export const whatsappConversationStatusEnum = pgEnum("whatsapp_conversation_status", [
  "active",
  "waiting_human",
  "closed"
]);

export const whatsappMessageDirectionEnum = pgEnum("whatsapp_message_direction", [
  "inbound",
  "outbound"
]);

export const whatsappMessageStatusEnum = pgEnum("whatsapp_message_status", [
  "sent",
  "delivered",
  "read",
  "failed"
]);

export const whatsappSenderTypeEnum = pgEnum("whatsapp_sender_type", [
  "customer",
  "bot",
  "staff"
]);

export const whatsappTemplateCategoryEnum = pgEnum("whatsapp_template_category", [
  "marketing",
  "utility",
  "authentication"
]);

export const whatsappTemplateStatusEnum = pgEnum("whatsapp_template_status", [
  "approved",
  "pending",
  "rejected"
]);

export const whatsappBroadcastStatusEnum = pgEnum("whatsapp_broadcast_status", [
  "draft",
  "scheduled",
  "sending",
  "completed",
  "failed"
]);

export const whatsappConversationStateEnum = pgEnum("whatsapp_conversation_state", [
  "idle",
  "browsing_menu",
  "cart",
  "reservation",
  "marketing_optin",
  "support",
  "human_takeover"
]);

// WhatsApp Customers (links WhatsApp users to CRM customers)
export const whatsappCustomers = whatsappSchema.table("whatsapp_customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),

  // WhatsApp Identity
  phoneNumber: text("phone_number").notNull().unique(),
  profileName: text("profile_name"),

  // Link to CRM customer
  customerId: varchar("customer_id").references(() => customers.id, { onDelete: "set null" }),

  // Marketing
  optInMarketing: boolean("opt_in_marketing").notNull().default(false),
  optInDate: timestamp("opt_in_date"),
  lastInteraction: timestamp("last_interaction"),

  // Conversation State
  conversationState: whatsappConversationStateEnum("conversation_state").default("idle"),
  contextData: text("context_data"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// WhatsApp Conversations
export const whatsappConversations = whatsappSchema.table("whatsapp_conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  whatsappCustomerId: varchar("whatsapp_customer_id").notNull().references(() => whatsappCustomers.id, { onDelete: "cascade" }),

  // Status
  status: whatsappConversationStatusEnum("status").notNull().default("active"),
  assignedToUserId: varchar("assigned_to_user_id").references(() => users.id, { onDelete: "set null" }),

  // Timing
  startedAt: timestamp("started_at").defaultNow(),
  closedAt: timestamp("closed_at"),

  // WhatsApp Windows (for pricing optimization)
  customerServiceWindowExpires: timestamp("customer_service_window_expires"),
  freeEntryPointExpires: timestamp("free_entry_point_expires"),

  createdAt: timestamp("created_at").defaultNow(),
});

// WhatsApp Messages
export const whatsappMessages = whatsappSchema.table("whatsapp_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull().references(() => whatsappConversations.id, { onDelete: "cascade" }),

  // Meta's message ID
  whatsappMessageId: text("whatsapp_message_id"),

  // Direction & Type
  direction: whatsappMessageDirectionEnum("direction").notNull(),
  type: text("type").notNull(),
  content: text("content").notNull(),

  // Status (for outbound messages)
  status: whatsappMessageStatusEnum("status"),

  // Template tracking (for pricing)
  isTemplate: boolean("is_template").notNull().default(false),
  templateCategory: whatsappTemplateCategoryEnum("template_category"),
  cost: decimal("cost", { precision: 10, scale: 4 }),

  // Sender
  senderType: whatsappSenderTypeEnum("sender_type").notNull(),
  sentByUserId: varchar("sent_by_user_id").references(() => users.id, { onDelete: "set null" }),

  // Timing
  timestamp: timestamp("timestamp").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// WhatsApp Templates (Meta-approved message templates)
export const whatsappTemplates = whatsappSchema.table("whatsapp_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),

  // Template identity
  name: text("name").notNull().unique(),
  category: whatsappTemplateCategoryEnum("category").notNull(),
  language: varchar("language", { length: 10 }).notNull().default("en_US"),

  // Status
  status: whatsappTemplateStatusEnum("status").notNull().default("pending"),

  // Template structure (JSON)
  components: text("components").notNull(),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// WhatsApp Broadcasts (marketing campaigns)
export const whatsappBroadcasts = whatsappSchema.table("whatsapp_broadcasts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),

  // Campaign details
  name: text("name").notNull(),
  templateId: varchar("template_id").notNull().references(() => whatsappTemplates.id),

  // Targeting
  targetCriteria: text("target_criteria"),

  // Scheduling
  scheduledAt: timestamp("scheduled_at"),
  sentAt: timestamp("sent_at"),

  // Status
  status: whatsappBroadcastStatusEnum("status").notNull().default("draft"),

  // Analytics
  totalRecipients: integer("total_recipients").notNull().default(0),
  sentCount: integer("sent_count").notNull().default(0),
  deliveredCount: integer("delivered_count").notNull().default(0),
  readCount: integer("read_count").notNull().default(0),
  failedCount: integer("failed_count").notNull().default(0),

  // Creator
  createdByUserId: varchar("created_by_user_id").notNull().references(() => users.id),

  createdAt: timestamp("created_at").defaultNow(),
});

// WhatsApp Broadcast Recipients (tracking individual sends)
export const whatsappBroadcastRecipients = whatsappSchema.table("whatsapp_broadcast_recipients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  broadcastId: varchar("broadcast_id").notNull().references(() => whatsappBroadcasts.id, { onDelete: "cascade" }),
  whatsappCustomerId: varchar("whatsapp_customer_id").notNull().references(() => whatsappCustomers.id, { onDelete: "cascade" }),

  // Linked message
  messageId: varchar("message_id").references(() => whatsappMessages.id, { onDelete: "set null" }),

  // Status tracking
  status: text("status").notNull().default("pending"),
  sentAt: timestamp("sent_at"),
  deliveredAt: timestamp("delivered_at"),
  readAt: timestamp("read_at"),
  error: text("error"),
});

// ============================================================================
// LEGACY COMPATIBILITY (can be removed after migration)
// ============================================================================

// Keep locations as alias for branches during transition
export const locations = branches;
export const menuItemLocations = menuItemBranches;
export const eventLocations = eventBranches;

// ============================================================================
// INSERT SCHEMAS
// ============================================================================

// Branches
export const insertBranchSchema = createInsertSchema(branches).omit({ id: true, createdAt: true, updatedAt: true });

// Sections
export const insertSectionSchema = createInsertSchema(sections).omit({ id: true, createdAt: true, updatedAt: true });

// Tables
export const insertTableSchema = createInsertSchema(tables).omit({ id: true, createdAt: true });

// Menu Categories
export const insertMenuCategorySchema = createInsertSchema(menuCategories).omit({ id: true, createdAt: true, updatedAt: true });

// Menu Items
export const insertMenuItemSchema = createInsertSchema(menuItems).omit({ id: true, createdAt: true, updatedAt: true });

// Menu Item Branches
export const insertMenuItemBranchSchema = createInsertSchema(menuItemBranches).omit({ id: true, createdAt: true });

// Menu Item Sections
export const insertMenuItemSectionSchema = createInsertSchema(menuItemSections).omit({ id: true, createdAt: true });

// Menu Item Add-ons
export const insertMenuItemAddOnSchema = createInsertSchema(menuItemAddOns).omit({ id: true, createdAt: true });

// Modifier Groups
export const insertModifierGroupSchema = createInsertSchema(modifierGroups).omit({ id: true, createdAt: true });

// Modifier Group Options
export const insertModifierGroupOptionSchema = createInsertSchema(modifierGroupOptions).omit({ id: true, createdAt: true });

// Customers
export const insertCustomerSchema = createInsertSchema(customers).omit({ id: true, createdAt: true, updatedAt: true });

// Users
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });

// User Branches
export const insertUserBranchSchema = createInsertSchema(userBranches).omit({ id: true, createdAt: true });

// Orders
export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, createdAt: true, updatedAt: true });

// Order Items
export const insertOrderItemSchema = createInsertSchema(orderItems).omit({ id: true, createdAt: true });

// Reservations
export const insertReservationSchema = createInsertSchema(reservations).omit({ id: true, createdAt: true, updatedAt: true });

// Section Time Slots
export const insertSectionTimeSlotSchema = createInsertSchema(sectionTimeSlots).omit({ id: true, createdAt: true, updatedAt: true });

// Events
export const insertEventSchema = createInsertSchema(events).omit({ id: true, createdAt: true, updatedAt: true });

// Event Branches
export const insertEventBranchSchema = createInsertSchema(eventBranches).omit({ id: true, createdAt: true });

// Event Sections
export const insertEventSectionSchema = createInsertSchema(eventSections).omit({ id: true, createdAt: true });

// Feedback
export const insertFeedbackSchema = createInsertSchema(feedback).omit({ id: true, createdAt: true, updatedAt: true });

// WhatsApp Customers
export const insertWhatsappCustomerSchema = createInsertSchema(whatsappCustomers).omit({ id: true, createdAt: true, updatedAt: true });

// WhatsApp Conversations
export const insertWhatsappConversationSchema = createInsertSchema(whatsappConversations).omit({ id: true, createdAt: true });

// WhatsApp Messages
export const insertWhatsappMessageSchema = createInsertSchema(whatsappMessages).omit({ id: true, createdAt: true });

// WhatsApp Templates
export const insertWhatsappTemplateSchema = createInsertSchema(whatsappTemplates).omit({ id: true, createdAt: true, updatedAt: true });

// WhatsApp Broadcasts
export const insertWhatsappBroadcastSchema = createInsertSchema(whatsappBroadcasts).omit({ id: true, createdAt: true });

// WhatsApp Broadcast Recipients
export const insertWhatsappBroadcastRecipientSchema = createInsertSchema(whatsappBroadcastRecipients).omit({ id: true });

// ============================================================================
// TYPES
// ============================================================================

// Branches
export type InsertBranch = z.infer<typeof insertBranchSchema>;
export type Branch = typeof branches.$inferSelect;

// Sections
export type InsertSection = z.infer<typeof insertSectionSchema>;
export type Section = typeof sections.$inferSelect;

// Tables
export type InsertTable = z.infer<typeof insertTableSchema>;
export type Table = typeof tables.$inferSelect;

// Menu Categories
export type InsertMenuCategory = z.infer<typeof insertMenuCategorySchema>;
export type MenuCategory = typeof menuCategories.$inferSelect;

// Menu Items
export type InsertMenuItem = z.infer<typeof insertMenuItemSchema>;
export type MenuItem = typeof menuItems.$inferSelect;

// Menu Item Branches
export type InsertMenuItemBranch = z.infer<typeof insertMenuItemBranchSchema>;
export type MenuItemBranch = typeof menuItemBranches.$inferSelect;

// Menu Item Sections
export type InsertMenuItemSection = z.infer<typeof insertMenuItemSectionSchema>;
export type MenuItemSection = typeof menuItemSections.$inferSelect;

// Menu Item Add-ons
export type InsertMenuItemAddOn = z.infer<typeof insertMenuItemAddOnSchema>;
export type MenuItemAddOn = typeof menuItemAddOns.$inferSelect;

// Modifier Groups
export type InsertModifierGroup = z.infer<typeof insertModifierGroupSchema>;
export type ModifierGroup = typeof modifierGroups.$inferSelect;

// Modifier Group Options
export type InsertModifierGroupOption = z.infer<typeof insertModifierGroupOptionSchema>;
export type ModifierGroupOption = typeof modifierGroupOptions.$inferSelect;

// Customers
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customers.$inferSelect;

// Customer Frequent Items
export type CustomerFrequentItem = typeof customerFrequentItems.$inferSelect;

// Users
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// User Branches
export type InsertUserBranch = z.infer<typeof insertUserBranchSchema>;
export type UserBranch = typeof userBranches.$inferSelect;

// Role Permissions
export type RolePermission = typeof rolePermissions.$inferSelect;

// Orders
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;

// Order Items
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type OrderItem = typeof orderItems.$inferSelect;

// Station Queue
export type StationQueueItem = typeof stationQueue.$inferSelect;

// Reservations
export type InsertReservation = z.infer<typeof insertReservationSchema>;
export type Reservation = typeof reservations.$inferSelect;

// Section Time Slots
export type InsertSectionTimeSlot = z.infer<typeof insertSectionTimeSlotSchema>;
export type SectionTimeSlot = typeof sectionTimeSlots.$inferSelect;

// Events
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof events.$inferSelect;

// Event Branches
export type InsertEventBranch = z.infer<typeof insertEventBranchSchema>;
export type EventBranch = typeof eventBranches.$inferSelect;

// Event Sections
export type InsertEventSection = z.infer<typeof insertEventSectionSchema>;
export type EventSection = typeof eventSections.$inferSelect;

// Feedback
export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;
export type Feedback = typeof feedback.$inferSelect;

// WhatsApp Customers
export type InsertWhatsappCustomer = z.infer<typeof insertWhatsappCustomerSchema>;
export type WhatsappCustomer = typeof whatsappCustomers.$inferSelect;

// WhatsApp Conversations
export type InsertWhatsappConversation = z.infer<typeof insertWhatsappConversationSchema>;
export type WhatsappConversation = typeof whatsappConversations.$inferSelect;

// WhatsApp Messages
export type InsertWhatsappMessage = z.infer<typeof insertWhatsappMessageSchema>;
export type WhatsappMessage = typeof whatsappMessages.$inferSelect;

// WhatsApp Templates
export type InsertWhatsappTemplate = z.infer<typeof insertWhatsappTemplateSchema>;
export type WhatsappTemplate = typeof whatsappTemplates.$inferSelect;

// WhatsApp Broadcasts
export type InsertWhatsappBroadcast = z.infer<typeof insertWhatsappBroadcastSchema>;
export type WhatsappBroadcast = typeof whatsappBroadcasts.$inferSelect;

// WhatsApp Broadcast Recipients
export type InsertWhatsappBroadcastRecipient = z.infer<typeof insertWhatsappBroadcastRecipientSchema>;
export type WhatsappBroadcastRecipient = typeof whatsappBroadcastRecipients.$inferSelect;

// Legacy type aliases
export type Location = Branch;
export type InsertLocation = InsertBranch;
export type MenuItemLocation = MenuItemBranch;
export type InsertMenuItemLocation = InsertMenuItemBranch;
export type EventLocation = EventBranch;
export type InsertEventLocation = InsertEventBranch;
