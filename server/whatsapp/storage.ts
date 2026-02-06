// WhatsApp Database Storage Layer

import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "../db";
import {
  whatsappCustomers,
  whatsappConversations,
  whatsappMessages,
  whatsappTemplates,
  whatsappBroadcasts,
  whatsappBroadcastRecipients,
  customers,
  type WhatsappCustomer,
  type WhatsappConversation,
  type WhatsappMessage,
  type InsertWhatsappCustomer,
  type InsertWhatsappConversation,
  type InsertWhatsappMessage,
} from "../../shared/schema";
import type { BotContext } from "./types";

export class WhatsAppStorage {
  // ============================================================================
  // WHATSAPP CUSTOMERS
  // ============================================================================

  async getWhatsAppCustomerByPhone(phoneNumber: string): Promise<WhatsappCustomer | null> {
    const [customer] = await db
      .select()
      .from(whatsappCustomers)
      .where(eq(whatsappCustomers.phoneNumber, phoneNumber))
      .limit(1);

    return customer || null;
  }

  async createWhatsAppCustomer(data: {
    phoneNumber: string;
    profileName: string | null;
  }): Promise<WhatsappCustomer> {
    const [customer] = await db
      .insert(whatsappCustomers)
      .values({
        phoneNumber: data.phoneNumber,
        profileName: data.profileName,
        conversationState: 'idle',
        contextData: JSON.stringify({ state: 'idle', data: {} }),
      })
      .returning();

    return customer;
  }

  async updateWhatsAppCustomer(
    id: string,
    data: Partial<InsertWhatsappCustomer>
  ): Promise<WhatsappCustomer> {
    const [customer] = await db
      .update(whatsappCustomers)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(whatsappCustomers.id, id))
      .returning();

    return customer;
  }

  async updateCustomerState(
    customerId: string,
    state: string,
    contextData: BotContext
  ): Promise<void> {
    await db
      .update(whatsappCustomers)
      .set({
        conversationState: state as any,
        contextData: JSON.stringify(contextData),
        updatedAt: new Date(),
      })
      .where(eq(whatsappCustomers.id, customerId));
  }

  async updateLastInteraction(customerId: string): Promise<void> {
    await db
      .update(whatsappCustomers)
      .set({
        lastInteraction: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(whatsappCustomers.id, customerId));
  }

  async linkWhatsAppCustomerToCRM(
    whatsappCustomerId: string,
    crmCustomerId: string
  ): Promise<void> {
    await db
      .update(whatsappCustomers)
      .set({
        customerId: crmCustomerId,
        updatedAt: new Date(),
      })
      .where(eq(whatsappCustomers.id, whatsappCustomerId));
  }

  // ============================================================================
  // CRM CUSTOMER INTEGRATION
  // ============================================================================

  async getCRMCustomerByPhone(phone: string) {
    // Normalize phone number (remove spaces, dashes, etc.)
    const normalizedPhone = phone.replace(/[\s\-\(\)]/g, '');

    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.phone, normalizedPhone))
      .limit(1);

    return customer || null;
  }

  // ============================================================================
  // CONVERSATIONS
  // ============================================================================

  async getActiveConversation(
    whatsappCustomerId: string
  ): Promise<WhatsappConversation | null> {
    const [conversation] = await db
      .select()
      .from(whatsappConversations)
      .where(
        and(
          eq(whatsappConversations.whatsappCustomerId, whatsappCustomerId),
          eq(whatsappConversations.status, 'active')
        )
      )
      .orderBy(desc(whatsappConversations.startedAt))
      .limit(1);

    return conversation || null;
  }

  async createConversation(
    whatsappCustomerId: string
  ): Promise<WhatsappConversation> {
    const [conversation] = await db
      .insert(whatsappConversations)
      .values({
        whatsappCustomerId,
        status: 'active',
      })
      .returning();

    return conversation;
  }

  async updateConversationWindows(
    conversationId: string,
    customerServiceWindowExpires: Date | null,
    freeEntryPointExpires: Date | null
  ): Promise<void> {
    await db
      .update(whatsappConversations)
      .set({
        customerServiceWindowExpires,
        freeEntryPointExpires,
      })
      .where(eq(whatsappConversations.id, conversationId));
  }

  async updateConversationStatus(
    conversationId: string,
    status: 'active' | 'waiting_human' | 'closed',
    assignedToUserId?: string | null
  ): Promise<void> {
    await db
      .update(whatsappConversations)
      .set({
        status: status as any,
        ...(assignedToUserId !== undefined && { assignedToUserId }),
        ...(status === 'closed' && { closedAt: new Date() }),
      })
      .where(eq(whatsappConversations.id, conversationId));
  }

  async getConversationById(
    conversationId: string
  ): Promise<WhatsappConversation | null> {
    const [conversation] = await db
      .select()
      .from(whatsappConversations)
      .where(eq(whatsappConversations.id, conversationId))
      .limit(1);

    return conversation || null;
  }

  async getConversationsForCRM(filters?: {
    status?: string;
    assignedToUserId?: string;
    limit?: number;
  }) {
    let query = db
      .select({
        conversation: whatsappConversations,
        customer: whatsappCustomers,
      })
      .from(whatsappConversations)
      .leftJoin(
        whatsappCustomers,
        eq(whatsappConversations.whatsappCustomerId, whatsappCustomers.id)
      )
      .orderBy(desc(whatsappConversations.startedAt));

    if (filters?.status) {
      query = query.where(eq(whatsappConversations.status, filters.status as any));
    }

    if (filters?.assignedToUserId) {
      query = query.where(
        eq(whatsappConversations.assignedToUserId, filters.assignedToUserId)
      );
    }

    const results = await query.limit(filters?.limit || 50);

    return results;
  }

  // ============================================================================
  // MESSAGES
  // ============================================================================

  async saveMessage(data: {
    conversationId: string;
    whatsappMessageId: string | null;
    direction: 'inbound' | 'outbound';
    type: string;
    content: string;
    senderType: 'customer' | 'bot' | 'staff';
    sentByUserId?: string;
    isTemplate?: boolean;
    templateCategory?: 'marketing' | 'utility' | 'authentication';
    timestamp?: Date;
  }): Promise<WhatsappMessage> {
    const [message] = await db
      .insert(whatsappMessages)
      .values({
        conversationId: data.conversationId,
        whatsappMessageId: data.whatsappMessageId || null,
        direction: data.direction as any,
        type: data.type,
        content: data.content,
        senderType: data.senderType as any,
        sentByUserId: data.sentByUserId || null,
        isTemplate: data.isTemplate || false,
        templateCategory: data.templateCategory as any,
        timestamp: data.timestamp || new Date(),
      })
      .returning();

    return message;
  }

  async getMessageByWhatsAppId(
    whatsappMessageId: string
  ): Promise<WhatsappMessage | null> {
    const [message] = await db
      .select()
      .from(whatsappMessages)
      .where(eq(whatsappMessages.whatsappMessageId, whatsappMessageId))
      .limit(1);

    return message || null;
  }

  async updateMessageStatus(
    messageId: string,
    status: 'sent' | 'delivered' | 'read' | 'failed'
  ): Promise<void> {
    await db
      .update(whatsappMessages)
      .set({ status: status as any })
      .where(eq(whatsappMessages.id, messageId));
  }

  async updateMessageCost(
    messageId: string,
    cost: number,
    pricingInfo: any
  ): Promise<void> {
    await db
      .update(whatsappMessages)
      .set({
        cost: cost.toString(),
        // Could also store full pricing info in a JSON field if needed
      })
      .where(eq(whatsappMessages.id, messageId));
  }

  async updateMessageError(messageId: string, error: string): Promise<void> {
    // You might want to add an error field to the schema
    // For now, we can append to content or use a separate error tracking system
    console.error('Message error:', { messageId, error });
  }

  async getConversationMessages(
    conversationId: string,
    limit: number = 50
  ): Promise<WhatsappMessage[]> {
    const messages = await db
      .select()
      .from(whatsappMessages)
      .where(eq(whatsappMessages.conversationId, conversationId))
      .orderBy(whatsappMessages.timestamp)
      .limit(limit);

    return messages;
  }

  // ============================================================================
  // TEMPLATES
  // ============================================================================

  async getTemplateByName(name: string) {
    const [template] = await db
      .select()
      .from(whatsappTemplates)
      .where(eq(whatsappTemplates.name, name))
      .limit(1);

    return template || null;
  }

  async getAllTemplates() {
    return db
      .select()
      .from(whatsappTemplates)
      .where(eq(whatsappTemplates.status, 'approved'))
      .orderBy(whatsappTemplates.name);
  }

  // ============================================================================
  // ANALYTICS
  // ============================================================================

  async getMessageStats(dateRange?: { from: Date; to: Date }) {
    // Get message counts and costs
    const stats = await db
      .select({
        totalMessages: sql<number>`COUNT(*)`,
        totalCost: sql<number>`SUM(COALESCE(${whatsappMessages.cost}, 0))`,
        templateMessages: sql<number>`SUM(CASE WHEN ${whatsappMessages.isTemplate} THEN 1 ELSE 0 END)`,
        freeMessages: sql<number>`SUM(CASE WHEN COALESCE(${whatsappMessages.cost}, 0) = 0 THEN 1 ELSE 0 END)`,
      })
      .from(whatsappMessages);

    return stats[0];
  }

  async getActiveConversationsCount(): Promise<number> {
    const result = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(whatsappConversations)
      .where(eq(whatsappConversations.status, 'active'));

    return result[0]?.count || 0;
  }
}
