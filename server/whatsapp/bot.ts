// WhatsApp Bot Logic - State Machine

import type { WhatsappCustomer, WhatsappConversation } from "../../shared/schema";
import type { IncomingMessage, BotContext } from "./types";
import {
  sendTextMessage,
  sendButtonsMessage,
  sendListMessage,
  getWhatsAppConfig,
  markMessageAsRead,
} from "./sender";
import { WhatsAppStorage } from "./storage";
import { storage as crmStorage } from "../storage";

const whatsappStorage = new WhatsAppStorage();

/**
 * Main bot message handler
 * Routes messages based on conversation state
 */
export async function handleBotMessage(
  customer: WhatsappCustomer,
  conversation: WhatsappConversation,
  message: IncomingMessage
) {
  try {
    const config = getWhatsAppConfig();

    // Mark message as read
    await markMessageAsRead(config, message.id);

    // Parse bot context
    const context: BotContext = customer.contextData
      ? JSON.parse(customer.contextData)
      : { state: 'idle', data: {} };

    const state = customer.conversationState || 'idle';

    // Route to appropriate handler based on state
    switch (state) {
      case 'idle':
        await handleIdleState(customer, conversation, message, context);
        break;

      case 'browsing_menu':
        await handleMenuBrowsing(customer, conversation, message, context);
        break;

      case 'reservation':
        await handleReservation(customer, conversation, message, context);
        break;

      case 'marketing_optin':
        await handleMarketingOptIn(customer, conversation, message, context);
        break;

      case 'support':
        await handleSupport(customer, conversation, message, context);
        break;

      default:
        // Unknown state, reset to idle
        await showMainMenu(customer, conversation);
        break;
    }
  } catch (error) {
    console.error('Error in bot message handler:', error);

    // Send error message to user
    const config = getWhatsAppConfig();
    await sendTextMessage(
      config,
      customer.phoneNumber,
      "Sorry, I encountered an error. Please try again or type 'menu' to start over."
    );
  }
}

/**
 * IDLE STATE - Show main menu
 */
async function handleIdleState(
  customer: WhatsappCustomer,
  conversation: WhatsappConversation,
  message: IncomingMessage,
  context: BotContext
) {
  const config = getWhatsAppConfig();

  // Check for button/list reply
  if (message.type === 'interactive') {
    const buttonId = message.interactive?.button_reply?.id;
    const listId = message.interactive?.list_reply?.id;
    const selectedId = buttonId || listId;

    switch (selectedId) {
      case 'MENU':
        await startMenuBrowsing(customer, conversation);
        break;

      case 'RESERVATION':
        await startReservation(customer, conversation);
        break;

      case 'OFFERS':
        await handleMarketingOptIn(customer, conversation, message, context);
        break;

      case 'SUPPORT':
        await handleSupport(customer, conversation, message, context);
        break;

      default:
        await showMainMenu(customer, conversation);
        break;
    }
  } else {
    // Text message - show main menu
    await showMainMenu(customer, conversation);
  }
}

/**
 * Show main menu
 */
async function showMainMenu(
  customer: WhatsappCustomer,
  conversation: WhatsappConversation
) {
  const config = getWhatsAppConfig();

  // Update state to idle
  await whatsappStorage.updateCustomerState(customer.id, 'idle', {
    state: 'idle',
    data: {},
  });

  // Send main menu with buttons
  await sendButtonsMessage(
    config,
    customer.phoneNumber,
    "Welcome to Hadoota Masreya! 🎉\n\nHow can I help you today?",
    [
      { id: 'MENU', title: '🍽 Browse Menu' },
      { id: 'RESERVATION', title: '📅 Book Table' },
      { id: 'OFFERS', title: '🎁 Special Offers' },
    ],
    {
      footer: 'Type "help" anytime for assistance',
    }
  );

  // Store outgoing message
  await whatsappStorage.saveMessage({
    conversationId: conversation.id,
    whatsappMessageId: null,
    direction: 'outbound',
    type: 'interactive',
    content: JSON.stringify({ type: 'main_menu' }),
    senderType: 'bot',
  });
}

/**
 * MENU BROWSING STATE
 */
async function startMenuBrowsing(
  customer: WhatsappCustomer,
  conversation: WhatsappConversation
) {
  const config = getWhatsAppConfig();

  // Update state
  await whatsappStorage.updateCustomerState(customer.id, 'browsing_menu', {
    state: 'browsing_menu',
    data: {},
  });

  // Get menu categories
  const categories = await crmStorage.getMenuCategories();

  if (categories.length === 0) {
    await sendTextMessage(
      config,
      customer.phoneNumber,
      "Sorry, our menu is currently being updated. Please check back soon!"
    );
    await showMainMenu(customer, conversation);
    return;
  }

  // Show categories as list (max 10 items)
  const rows = categories.slice(0, 10).map((cat) => ({
    id: `CAT_${cat.id}`,
    title: cat.name.substring(0, 24), // Max 24 chars
    description: cat.description?.substring(0, 72) || undefined, // Max 72 chars
  }));

  await sendListMessage(
    config,
    customer.phoneNumber,
    "🍽 **Browse Our Menu**\n\nSelect a category to explore:",
    "View Categories",
    [{ rows }],
    {
      footer: "Type 'menu' to go back",
    }
  );

  // Store outgoing message
  await whatsappStorage.saveMessage({
    conversationId: conversation.id,
    whatsappMessageId: null,
    direction: 'outbound',
    type: 'interactive',
    content: JSON.stringify({ type: 'category_list', categories: categories.map(c => c.id) }),
    senderType: 'bot',
  });
}

async function handleMenuBrowsing(
  customer: WhatsappCustomer,
  conversation: WhatsappConversation,
  message: IncomingMessage,
  context: BotContext
) {
  const config = getWhatsAppConfig();

  // Check for back to main menu
  if (message.type === 'text' && message.text?.body.toLowerCase() === 'menu') {
    await showMainMenu(customer, conversation);
    return;
  }

  // Handle category selection
  if (message.type === 'interactive') {
    const listId = message.interactive?.list_reply?.id;

    if (listId?.startsWith('CAT_')) {
      const categoryId = listId.replace('CAT_', '');
      await showMenuItems(customer, conversation, categoryId);
      return;
    }

    if (listId?.startsWith('ITEM_')) {
      const menuItemId = listId.replace('ITEM_', '');
      await showMenuItemDetails(customer, conversation, menuItemId);
      return;
    }
  }

  // Default: show categories again
  await startMenuBrowsing(customer, conversation);
}

async function showMenuItems(
  customer: WhatsappCustomer,
  conversation: WhatsappConversation,
  categoryId: string
) {
  const config = getWhatsAppConfig();

  // Get menu items for this category
  const allItems = await crmStorage.getAllMenuItems();
  const items = allItems.filter((item) => item.categoryId === categoryId);

  if (items.length === 0) {
    await sendTextMessage(
      config,
      customer.phoneNumber,
      "No items found in this category. Please select another category."
    );
    await startMenuBrowsing(customer, conversation);
    return;
  }

  // Show items as list (max 10)
  const rows = items.slice(0, 10).map((item) => ({
    id: `ITEM_${item.id}`,
    title: item.name.substring(0, 24),
    description: `AED ${parseFloat(item.basePrice).toFixed(2)}`.substring(0, 72),
  }));

  await sendListMessage(
    config,
    customer.phoneNumber,
    "Select an item to view details:",
    "View Items",
    [{ rows }],
    {
      footer: "Type 'menu' to go back",
    }
  );

  // Update context
  await whatsappStorage.updateCustomerState(customer.id, 'browsing_menu', {
    state: 'browsing_menu',
    data: { selectedCategoryId: categoryId },
  });

  await whatsappStorage.saveMessage({
    conversationId: conversation.id,
    whatsappMessageId: null,
    direction: 'outbound',
    type: 'interactive',
    content: JSON.stringify({ type: 'item_list', categoryId }),
    senderType: 'bot',
  });
}

async function showMenuItemDetails(
  customer: WhatsappCustomer,
  conversation: WhatsappConversation,
  menuItemId: string
) {
  const config = getWhatsAppConfig();

  const item = await crmStorage.getMenuItem(menuItemId);

  if (!item) {
    await sendTextMessage(
      config,
      customer.phoneNumber,
      "Item not found. Please try again."
    );
    await startMenuBrowsing(customer, conversation);
    return;
  }

  const price = parseFloat(item.basePrice).toFixed(2);
  const details = `🍽 **${item.name}**\n\n${item.description}\n\n💰 Price: AED ${price}`;

  // Send text with item details
  await sendTextMessage(config, customer.phoneNumber, details);

  // Show action buttons
  await sendButtonsMessage(
    config,
    customer.phoneNumber,
    "What would you like to do?",
    [
      { id: 'BACK_TO_MENU', title: '⬅️ Back to Menu' },
      { id: 'MAIN_MENU', title: '🏠 Main Menu' },
    ]
  );

  await whatsappStorage.saveMessage({
    conversationId: conversation.id,
    whatsappMessageId: null,
    direction: 'outbound',
    type: 'text',
    content: JSON.stringify({ type: 'item_details', itemId: menuItemId }),
    senderType: 'bot',
  });
}

/**
 * RESERVATION STATE
 */
async function startReservation(
  customer: WhatsappCustomer,
  conversation: WhatsappConversation
) {
  const config = getWhatsAppConfig();

  // Update state
  await whatsappStorage.updateCustomerState(customer.id, 'reservation', {
    state: 'reservation',
    data: {},
  });

  // Get branches
  const branches = await crmStorage.getAllBranches();

  if (branches.length === 0) {
    await sendTextMessage(
      config,
      customer.phoneNumber,
      "Sorry, we're not taking reservations at the moment. Please try again later."
    );
    await showMainMenu(customer, conversation);
    return;
  }

  // Show branches as list
  const rows = branches.map((branch) => ({
    id: `BRANCH_${branch.id}`,
    title: branch.name.substring(0, 24),
    description: branch.address?.substring(0, 72) || undefined,
  }));

  await sendListMessage(
    config,
    customer.phoneNumber,
    "📅 **Book a Table**\n\nFirst, select your preferred location:",
    "Select Branch",
    [{ rows }]
  );

  await whatsappStorage.saveMessage({
    conversationId: conversation.id,
    whatsappMessageId: null,
    direction: 'outbound',
    type: 'interactive',
    content: JSON.stringify({ type: 'branch_selection' }),
    senderType: 'bot',
  });
}

async function handleReservation(
  customer: WhatsappCustomer,
  conversation: WhatsappConversation,
  message: IncomingMessage,
  context: BotContext
) {
  const config = getWhatsAppConfig();

  // For now, simplified - just collect basic info
  await sendTextMessage(
    config,
    customer.phoneNumber,
    "Great! Reservation feature is coming soon. For now, please call us directly to book a table. Type 'menu' to return to main menu."
  );

  await showMainMenu(customer, conversation);
}

/**
 * MARKETING OPT-IN STATE
 */
async function handleMarketingOptIn(
  customer: WhatsappCustomer,
  conversation: WhatsappConversation,
  message: IncomingMessage,
  context: BotContext
) {
  const config = getWhatsAppConfig();

  await sendButtonsMessage(
    config,
    customer.phoneNumber,
    "🎁 **Special Offers & Events**\n\nWould you like to receive exclusive offers and event updates via WhatsApp?",
    [
      { id: 'OPTIN_YES', title: '✅ Yes, sign me up!' },
      { id: 'OPTIN_NO', title: '❌ No thanks' },
    ]
  );

  await whatsappStorage.updateCustomerState(customer.id, 'marketing_optin', {
    state: 'marketing_optin',
    data: {},
  });
}

/**
 * SUPPORT STATE
 */
async function handleSupport(
  customer: WhatsappCustomer,
  conversation: WhatsappConversation,
  message: IncomingMessage,
  context: BotContext
) {
  const config = getWhatsAppConfig();

  await sendTextMessage(
    config,
    customer.phoneNumber,
    "👋 We're here to help!\n\nOur support team will get back to you shortly. A staff member will respond to your message soon.\n\nType 'menu' to return to the main menu."
  );

  // Escalate to human
  await whatsappStorage.updateConversationStatus(conversation.id, 'waiting_human');

  await whatsappStorage.updateCustomerState(customer.id, 'support', {
    state: 'support',
    data: {},
  });
}
