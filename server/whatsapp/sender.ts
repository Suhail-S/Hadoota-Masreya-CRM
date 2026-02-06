// WhatsApp Message Sender

import type {
  OutgoingMessage,
  WhatsAppAPIResponse,
  WhatsAppAPIError,
  WhatsAppConfig,
} from './types';

const API_VERSION = 'v22.0';

/**
 * Send a message via WhatsApp Cloud API
 */
export async function sendWhatsAppMessage(
  config: WhatsAppConfig,
  message: OutgoingMessage
): Promise<WhatsAppAPIResponse> {
  const url = `https://graph.facebook.com/${API_VERSION}/${config.phoneNumberId}/messages`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const data = await response.json();

    if (!response.ok) {
      const error = data as WhatsAppAPIError;
      console.error('WhatsApp API Error:', {
        status: response.status,
        error: error.error,
      });
      throw new Error(
        `WhatsApp API Error: ${error.error.message} (code: ${error.error.code})`
      );
    }

    return data as WhatsAppAPIResponse;
  } catch (error) {
    console.error('Failed to send WhatsApp message:', error);
    throw error;
  }
}

/**
 * Helper: Send a simple text message
 */
export async function sendTextMessage(
  config: WhatsAppConfig,
  to: string,
  text: string
): Promise<WhatsAppAPIResponse> {
  return sendWhatsAppMessage(config, {
    messaging_product: 'whatsapp',
    to,
    type: 'text',
    text: {
      body: text,
    },
  });
}

/**
 * Helper: Send an interactive buttons message
 */
export async function sendButtonsMessage(
  config: WhatsAppConfig,
  to: string,
  body: string,
  buttons: Array<{ id: string; title: string }>,
  options?: {
    header?: string;
    footer?: string;
  }
): Promise<WhatsAppAPIResponse> {
  // WhatsApp allows max 3 buttons
  if (buttons.length > 3) {
    throw new Error('Maximum 3 buttons allowed');
  }

  // Button titles must be max 20 characters
  buttons.forEach((btn, idx) => {
    if (btn.title.length > 20) {
      throw new Error(`Button ${idx + 1} title exceeds 20 characters`);
    }
  });

  return sendWhatsAppMessage(config, {
    messaging_product: 'whatsapp',
    to,
    type: 'interactive',
    interactive: {
      type: 'button',
      ...(options?.header && {
        header: {
          type: 'text',
          text: options.header,
        },
      }),
      body: {
        text: body,
      },
      ...(options?.footer && {
        footer: {
          text: options.footer,
        },
      }),
      action: {
        buttons: buttons.map((btn) => ({
          type: 'reply',
          reply: {
            id: btn.id,
            title: btn.title,
          },
        })),
      },
    },
  });
}

/**
 * Helper: Send an interactive list message
 */
export async function sendListMessage(
  config: WhatsAppConfig,
  to: string,
  body: string,
  buttonText: string,
  sections: Array<{
    title?: string;
    rows: Array<{
      id: string;
      title: string;
      description?: string;
    }>;
  }>,
  options?: {
    header?: string;
    footer?: string;
  }
): Promise<WhatsAppAPIResponse> {
  // Validate button text (max 20 chars)
  if (buttonText.length > 20) {
    throw new Error('Button text must be max 20 characters');
  }

  // Validate sections (max 10 total rows across all sections)
  const totalRows = sections.reduce((sum, section) => sum + section.rows.length, 0);
  if (totalRows > 10) {
    throw new Error('Maximum 10 rows allowed across all sections');
  }

  // Validate row titles (max 24 chars) and descriptions (max 72 chars)
  sections.forEach((section, secIdx) => {
    section.rows.forEach((row, rowIdx) => {
      if (row.title.length > 24) {
        throw new Error(
          `Section ${secIdx + 1}, row ${rowIdx + 1} title exceeds 24 characters`
        );
      }
      if (row.description && row.description.length > 72) {
        throw new Error(
          `Section ${secIdx + 1}, row ${rowIdx + 1} description exceeds 72 characters`
        );
      }
    });
  });

  return sendWhatsAppMessage(config, {
    messaging_product: 'whatsapp',
    to,
    type: 'interactive',
    interactive: {
      type: 'list',
      ...(options?.header && {
        header: {
          type: 'text',
          text: options.header,
        },
      }),
      body: {
        text: body,
      },
      ...(options?.footer && {
        footer: {
          text: options.footer,
        },
      }),
      action: {
        button: buttonText,
        sections,
      },
    },
  });
}

/**
 * Helper: Send a template message
 */
export async function sendTemplateMessage(
  config: WhatsAppConfig,
  to: string,
  templateName: string,
  languageCode: string = 'en_US',
  components?: Array<any>
): Promise<WhatsAppAPIResponse> {
  return sendWhatsAppMessage(config, {
    messaging_product: 'whatsapp',
    to,
    type: 'template',
    template: {
      name: templateName,
      language: {
        code: languageCode,
      },
      ...(components && { components }),
    },
  });
}

/**
 * Helper: Send an image message
 */
export async function sendImageMessage(
  config: WhatsAppConfig,
  to: string,
  imageUrl: string,
  caption?: string
): Promise<WhatsAppAPIResponse> {
  return sendWhatsAppMessage(config, {
    messaging_product: 'whatsapp',
    to,
    type: 'image',
    image: {
      link: imageUrl,
      ...(caption && { caption }),
    },
  });
}

/**
 * Mark a message as read
 */
export async function markMessageAsRead(
  config: WhatsAppConfig,
  messageId: string
): Promise<{ success: boolean }> {
  const url = `https://graph.facebook.com/${API_VERSION}/${config.phoneNumberId}/messages`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: messageId,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Failed to mark message as read:', data);
      return { success: false };
    }

    return { success: true };
  } catch (error) {
    console.error('Error marking message as read:', error);
    return { success: false };
  }
}

/**
 * Get WhatsApp config from environment
 */
export function getWhatsAppConfig(): WhatsAppConfig {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;
  const appSecret = process.env.WHATSAPP_APP_SECRET;

  if (!phoneNumberId || !accessToken || !verifyToken || !appSecret) {
    throw new Error(
      'Missing WhatsApp environment variables. Please set WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_ACCESS_TOKEN, WHATSAPP_VERIFY_TOKEN, and WHATSAPP_APP_SECRET'
    );
  }

  return {
    phoneNumberId,
    accessToken,
    verifyToken,
    appSecret,
  };
}
