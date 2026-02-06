// WhatsApp API Types and Interfaces

export interface WhatsAppConfig {
  phoneNumberId: string;
  accessToken: string;
  verifyToken: string;
  appSecret: string;
}

// Webhook Types
export interface WebhookEntry {
  id: string;
  changes: WebhookChange[];
}

export interface WebhookChange {
  value: {
    messaging_product: string;
    metadata: {
      display_phone_number: string;
      phone_number_id: string;
    };
    contacts?: Contact[];
    messages?: IncomingMessage[];
    statuses?: MessageStatus[];
  };
  field: string;
}

export interface Contact {
  profile: {
    name: string;
  };
  wa_id: string;
}

export interface IncomingMessage {
  from: string;
  id: string;
  timestamp: string;
  type: 'text' | 'interactive' | 'button' | 'image' | 'document' | 'audio' | 'video' | 'location';
  text?: {
    body: string;
  };
  interactive?: {
    type: 'button_reply' | 'list_reply';
    button_reply?: {
      id: string;
      title: string;
    };
    list_reply?: {
      id: string;
      title: string;
      description?: string;
    };
  };
  button?: {
    payload: string;
    text: string;
  };
  image?: {
    id: string;
    mime_type: string;
    sha256: string;
    caption?: string;
  };
}

export interface MessageStatus {
  id: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  recipient_id: string;
  errors?: Array<{
    code: number;
    title: string;
    message: string;
  }>;
  pricing?: {
    billable: boolean;
    pricing_model: string;
    category: string;
  };
}

// Outgoing Message Types
export interface BaseMessage {
  messaging_product: 'whatsapp';
  recipient_type?: 'individual';
  to: string;
}

export interface TextMessage extends BaseMessage {
  type: 'text';
  text: {
    preview_url?: boolean;
    body: string;
  };
}

export interface InteractiveButtonsMessage extends BaseMessage {
  type: 'interactive';
  interactive: {
    type: 'button';
    header?: {
      type: 'text';
      text: string;
    };
    body: {
      text: string;
    };
    footer?: {
      text: string;
    };
    action: {
      buttons: Array<{
        type: 'reply';
        reply: {
          id: string;
          title: string; // Max 20 chars
        };
      }>;
    };
  };
}

export interface InteractiveListMessage extends BaseMessage {
  type: 'interactive';
  interactive: {
    type: 'list';
    header?: {
      type: 'text';
      text: string;
    };
    body: {
      text: string;
    };
    footer?: {
      text: string;
    };
    action: {
      button: string; // Button text (max 20 chars)
      sections: Array<{
        title?: string;
        rows: Array<{
          id: string; // Max 200 chars
          title: string; // Max 24 chars
          description?: string; // Max 72 chars
        }>;
      }>;
    };
  };
}

export interface TemplateMessage extends BaseMessage {
  type: 'template';
  template: {
    name: string;
    language: {
      code: string; // e.g., "en_US", "ar"
    };
    components?: Array<{
      type: 'header' | 'body' | 'button';
      parameters?: Array<{
        type: 'text' | 'currency' | 'date_time' | 'image' | 'document';
        text?: string;
        currency?: {
          fallback_value: string;
          code: string;
          amount_1000: number;
        };
        date_time?: {
          fallback_value: string;
        };
        image?: {
          link: string;
        };
        document?: {
          link: string;
          filename: string;
        };
      }>;
      sub_type?: 'quick_reply' | 'url';
      index?: number;
    }>;
  };
}

export interface ImageMessage extends BaseMessage {
  type: 'image';
  image: {
    link?: string;
    id?: string;
    caption?: string;
  };
}

export type OutgoingMessage =
  | TextMessage
  | InteractiveButtonsMessage
  | InteractiveListMessage
  | TemplateMessage
  | ImageMessage;

// API Response Types
export interface WhatsAppAPIResponse {
  messaging_product: 'whatsapp';
  contacts: Array<{
    input: string;
    wa_id: string;
  }>;
  messages: Array<{
    id: string;
  }>;
}

export interface WhatsAppAPIError {
  error: {
    message: string;
    type: string;
    code: number;
    error_data?: {
      messaging_product: string;
      details: string;
    };
    error_subcode?: number;
    fbtrace_id?: string;
  };
}

// Bot State Types
export type BotState =
  | 'idle'
  | 'browsing_menu'
  | 'cart'
  | 'reservation'
  | 'marketing_optin'
  | 'support'
  | 'human_takeover';

export interface BotContext {
  state: BotState;
  data: {
    // Menu browsing
    selectedCategoryId?: string;
    selectedMenuItemId?: string;

    // Cart
    cartItems?: Array<{
      menuItemId: string;
      quantity: number;
      modifiers?: any;
    }>;

    // Reservation
    selectedBranchId?: string;
    selectedSectionId?: string;
    selectedDate?: string;
    selectedTime?: string;
    partySize?: number;
    specialRequests?: string;

    // General
    lastInteractionTime?: number;
  };
}

// Window Types (for pricing)
export interface ConversationWindows {
  customerServiceWindowExpires: Date | null;
  freeEntryPointExpires: Date | null;
}

export interface PricingInfo {
  isTemplate: boolean;
  category?: 'marketing' | 'utility' | 'authentication';
  cost: number;
  isFree: boolean;
  reason?: string;
}
