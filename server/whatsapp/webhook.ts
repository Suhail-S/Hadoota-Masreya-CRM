// WhatsApp Webhook Handler

import type { Request, Response } from 'express';
import crypto from 'crypto';
import type { WebhookEntry, IncomingMessage, MessageStatus } from './types';
import { getWhatsAppConfig } from './sender';
import { WhatsAppStorage } from './storage';
import { handleBotMessage } from './bot';

const storage = new WhatsAppStorage();

/**
 * Verify webhook (GET endpoint)
 * Meta sends a verification request when you first configure the webhook
 */
export function verifyWebhook(req: Request, res: Response) {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const config = getWhatsAppConfig();

  // Check if mode and token are correct
  if (mode === 'subscribe' && token === config.verifyToken) {
    console.log('✅ Webhook verified successfully');
    // Respond with challenge token from Meta
    res.status(200).send(challenge);
  } else {
    console.error('❌ Webhook verification failed');
    res.sendStatus(403);
  }
}

/**
 * Verify webhook signature (security check)
 */
function verifySignature(req: Request): boolean {
  const signature = req.headers['x-hub-signature-256'];

  if (!signature) {
    return false;
  }

  const config = getWhatsAppConfig();
  const bodyString = JSON.stringify(req.body);

  // Calculate expected signature using App Secret (not Access Token!)
  const expectedSignature = crypto
    .createHmac('sha256', config.appSecret)
    .update(bodyString)
    .digest('hex');

  const signatureHash = (signature as string).split('=')[1];

  // Compare signatures
  return crypto.timingSafeEqual(
    Buffer.from(signatureHash),
    Buffer.from(expectedSignature)
  );
}

/**
 * Handle incoming webhook (POST endpoint)
 * Receives messages and status updates from WhatsApp
 */
export async function handleWebhook(req: Request, res: Response) {
  try {
    // Verify signature (important for security)
    // Note: In development, you might want to disable this
    const isProduction = process.env.NODE_ENV === 'production';
    if (isProduction && !verifySignature(req)) {
      console.error('❌ Invalid webhook signature');
      return res.sendStatus(403);
    }

    // WhatsApp requires a 200 response within 20 seconds
    // So we acknowledge receipt immediately and process async
    res.sendStatus(200);

    // Process webhook data
    const body = req.body;

    if (body.object !== 'whatsapp_business_account') {
      console.warn('Unknown webhook object type:', body.object);
      return;
    }

    // Process each entry
    for (const entry of body.entry as WebhookEntry[]) {
      for (const change of entry.changes) {
        if (change.field !== 'messages') {
          continue;
        }

        const value = change.value;

        // Handle incoming messages
        if (value.messages && value.messages.length > 0) {
          for (const message of value.messages) {
            await handleIncomingMessage(message, value.contacts?.[0]);
          }
        }

        // Handle message status updates (delivered, read, etc.)
        if (value.statuses && value.statuses.length > 0) {
          for (const status of value.statuses) {
            await handleMessageStatus(status);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error processing webhook:', error);
    // Don't return error to WhatsApp - we already sent 200
    // Log the error for debugging
  }
}

/**
 * Handle an incoming message from a customer
 */
async function handleIncomingMessage(
  message: IncomingMessage,
  contact: any
) {
  try {
    console.log('📨 Incoming message:', {
      from: message.from,
      type: message.type,
      id: message.id,
    });

    const phoneNumber = message.from;
    const profileName = contact?.profile?.name || null;

    // Get or create WhatsApp customer
    let whatsappCustomer = await storage.getWhatsAppCustomerByPhone(phoneNumber);

    if (!whatsappCustomer) {
      whatsappCustomer = await storage.createWhatsAppCustomer({
        phoneNumber,
        profileName,
      });

      // Try to link to existing CRM customer by phone
      const crmCustomer = await storage.getCRMCustomerByPhone(phoneNumber);
      if (crmCustomer) {
        await storage.linkWhatsAppCustomerToCRM(whatsappCustomer.id, crmCustomer.id);
        console.log('🔗 Linked WhatsApp customer to CRM customer:', crmCustomer.id);
      }
    }

    // Get or create active conversation
    let conversation = await storage.getActiveConversation(whatsappCustomer.id);

    if (!conversation) {
      conversation = await storage.createConversation(whatsappCustomer.id);
    }

    // Update conversation windows
    // When customer messages, a 24h customer service window opens
    const now = new Date();
    const customerServiceWindowExpires = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours

    await storage.updateConversationWindows(
      conversation.id,
      customerServiceWindowExpires,
      null // FEP window only opens when we respond (handled in bot)
    );

    // Store the incoming message
    await storage.saveMessage({
      conversationId: conversation.id,
      whatsappMessageId: message.id,
      direction: 'inbound',
      type: message.type,
      content: JSON.stringify(message),
      senderType: 'customer',
      timestamp: new Date(parseInt(message.timestamp) * 1000),
    });

    // Update last interaction time
    await storage.updateLastInteraction(whatsappCustomer.id);

    // Check if conversation is in human takeover mode
    if (conversation.status === 'waiting_human') {
      // Notify staff (could send a notification here)
      console.log('👤 Message received while waiting for human:', {
        customerId: whatsappCustomer.id,
        conversationId: conversation.id,
      });
      // Don't auto-reply, staff will respond manually
      return;
    }

    // Route to bot for processing
    await handleBotMessage(whatsappCustomer, conversation, message);
  } catch (error) {
    console.error('Error handling incoming message:', error);
  }
}

/**
 * Handle message status updates (sent, delivered, read, failed)
 */
async function handleMessageStatus(status: MessageStatus) {
  try {
    console.log('📬 Message status update:', {
      id: status.id,
      status: status.status,
      recipient: status.recipient_id,
    });

    // Find the message by WhatsApp message ID and update its status
    const message = await storage.getMessageByWhatsAppId(status.id);

    if (!message) {
      console.warn('Message not found for status update:', status.id);
      return;
    }

    // Update message status
    await storage.updateMessageStatus(message.id, status.status);

    // If message has pricing info, store the cost
    if (status.pricing) {
      const cost = calculateMessageCost(status.pricing);
      await storage.updateMessageCost(message.id, cost, status.pricing);
    }

    // If message failed, log the error
    if (status.status === 'failed' && status.errors) {
      console.error('❌ Message delivery failed:', {
        messageId: status.id,
        errors: status.errors,
      });
      await storage.updateMessageError(
        message.id,
        JSON.stringify(status.errors)
      );
    }
  } catch (error) {
    console.error('Error handling message status:', error);
  }
}

/**
 * Calculate message cost based on pricing info from WhatsApp
 */
function calculateMessageCost(pricing: any): number {
  // WhatsApp returns pricing information in status webhooks
  // This is an estimate - actual costs may vary
  // You can also track costs using the pricing_analytics endpoint

  if (!pricing.billable) {
    return 0;
  }

  // Placeholder rates (as of 2026) - these should be loaded from config/database
  // Actual rates vary by country and template category
  const rates = {
    marketing: 0.0175, // Example: ~$0.0175 per marketing message
    utility: 0.0075,   // Example: ~$0.0075 per utility message
    authentication: 0.005, // Example: ~$0.005 per auth message
    service: 0, // Non-template messages are free
  };

  const category = pricing.category as keyof typeof rates;
  return rates[category] || 0;
}
