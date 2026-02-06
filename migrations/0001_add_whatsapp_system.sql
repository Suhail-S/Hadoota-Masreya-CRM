-- WhatsApp Bot System Migration
-- Creates WhatsApp_Manager schema and all related tables

-- Create schema
CREATE SCHEMA IF NOT EXISTS "WhatsApp_Manager";

-- ============================================================================
-- ENUMS (in public schema as they're referenced across schemas)
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE whatsapp_conversation_status AS ENUM ('active', 'waiting_human', 'closed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE whatsapp_message_direction AS ENUM ('inbound', 'outbound');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE whatsapp_message_status AS ENUM ('sent', 'delivered', 'read', 'failed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE whatsapp_sender_type AS ENUM ('customer', 'bot', 'staff');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE whatsapp_template_category AS ENUM ('marketing', 'utility', 'authentication');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE whatsapp_template_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE whatsapp_broadcast_status AS ENUM ('draft', 'scheduled', 'sending', 'completed', 'failed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE whatsapp_conversation_state AS ENUM ('idle', 'browsing_menu', 'cart', 'reservation', 'marketing_optin', 'support', 'human_takeover');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- WHATSAPP CUSTOMERS
-- ============================================================================

CREATE TABLE IF NOT EXISTS "WhatsApp_Manager"."whatsapp_customers" (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),

  -- WhatsApp Identity
  phone_number TEXT NOT NULL UNIQUE,
  profile_name TEXT,

  -- Link to CRM customer
  customer_id VARCHAR REFERENCES "Hadoota_Masreya_Manager".customers(id) ON DELETE SET NULL,

  -- Marketing
  opt_in_marketing BOOLEAN NOT NULL DEFAULT false,
  opt_in_date TIMESTAMP,
  last_interaction TIMESTAMP,

  -- Conversation State
  conversation_state whatsapp_conversation_state DEFAULT 'idle',
  context_data TEXT,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for fast phone lookup
CREATE INDEX IF NOT EXISTS idx_whatsapp_customers_phone ON "WhatsApp_Manager"."whatsapp_customers"(phone_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_customers_crm ON "WhatsApp_Manager"."whatsapp_customers"(customer_id);

-- ============================================================================
-- WHATSAPP CONVERSATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS "WhatsApp_Manager"."whatsapp_conversations" (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  whatsapp_customer_id VARCHAR NOT NULL REFERENCES "WhatsApp_Manager"."whatsapp_customers"(id) ON DELETE CASCADE,

  -- Status
  status whatsapp_conversation_status NOT NULL DEFAULT 'active',
  assigned_to_user_id VARCHAR REFERENCES "Hadoota_Masreya_Manager".users(id) ON DELETE SET NULL,

  -- Timing
  started_at TIMESTAMP DEFAULT NOW(),
  closed_at TIMESTAMP,

  -- WhatsApp Windows (for pricing optimization)
  customer_service_window_expires TIMESTAMP,
  free_entry_point_expires TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for conversation queries
CREATE INDEX IF NOT EXISTS idx_conversations_customer ON "WhatsApp_Manager"."whatsapp_conversations"(whatsapp_customer_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON "WhatsApp_Manager"."whatsapp_conversations"(status);
CREATE INDEX IF NOT EXISTS idx_conversations_assigned ON "WhatsApp_Manager"."whatsapp_conversations"(assigned_to_user_id);

-- ============================================================================
-- WHATSAPP MESSAGES
-- ============================================================================

CREATE TABLE IF NOT EXISTS "WhatsApp_Manager"."whatsapp_messages" (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id VARCHAR NOT NULL REFERENCES "WhatsApp_Manager"."whatsapp_conversations"(id) ON DELETE CASCADE,

  -- Meta's message ID
  whatsapp_message_id TEXT,

  -- Direction & Type
  direction whatsapp_message_direction NOT NULL,
  type TEXT NOT NULL,
  content TEXT NOT NULL,

  -- Status (for outbound messages)
  status whatsapp_message_status,

  -- Template tracking (for pricing)
  is_template BOOLEAN NOT NULL DEFAULT false,
  template_category whatsapp_template_category,
  cost DECIMAL(10, 4),

  -- Sender
  sender_type whatsapp_sender_type NOT NULL,
  sent_by_user_id VARCHAR REFERENCES "Hadoota_Masreya_Manager".users(id) ON DELETE SET NULL,

  -- Timing
  timestamp TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for message queries
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON "WhatsApp_Manager"."whatsapp_messages"(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_whatsapp_id ON "WhatsApp_Manager"."whatsapp_messages"(whatsapp_message_id);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON "WhatsApp_Manager"."whatsapp_messages"(timestamp DESC);

-- ============================================================================
-- WHATSAPP TEMPLATES
-- ============================================================================

CREATE TABLE IF NOT EXISTS "WhatsApp_Manager"."whatsapp_templates" (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Template identity
  name TEXT NOT NULL UNIQUE,
  category whatsapp_template_category NOT NULL,
  language VARCHAR(10) NOT NULL DEFAULT 'en_US',

  -- Status
  status whatsapp_template_status NOT NULL DEFAULT 'pending',

  -- Template structure (JSON)
  components TEXT NOT NULL,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_templates_name ON "WhatsApp_Manager"."whatsapp_templates"(name);
CREATE INDEX IF NOT EXISTS idx_templates_status ON "WhatsApp_Manager"."whatsapp_templates"(status);

-- ============================================================================
-- WHATSAPP BROADCASTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS "WhatsApp_Manager"."whatsapp_broadcasts" (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Campaign details
  name TEXT NOT NULL,
  template_id VARCHAR NOT NULL REFERENCES "WhatsApp_Manager"."whatsapp_templates"(id),

  -- Targeting
  target_criteria TEXT,

  -- Scheduling
  scheduled_at TIMESTAMP,
  sent_at TIMESTAMP,

  -- Status
  status whatsapp_broadcast_status NOT NULL DEFAULT 'draft',

  -- Analytics
  total_recipients INTEGER NOT NULL DEFAULT 0,
  sent_count INTEGER NOT NULL DEFAULT 0,
  delivered_count INTEGER NOT NULL DEFAULT 0,
  read_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,

  -- Creator
  created_by_user_id VARCHAR NOT NULL REFERENCES "Hadoota_Masreya_Manager".users(id),

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_broadcasts_status ON "WhatsApp_Manager"."whatsapp_broadcasts"(status);
CREATE INDEX IF NOT EXISTS idx_broadcasts_created_by ON "WhatsApp_Manager"."whatsapp_broadcasts"(created_by_user_id);

-- ============================================================================
-- WHATSAPP BROADCAST RECIPIENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS "WhatsApp_Manager"."whatsapp_broadcast_recipients" (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  broadcast_id VARCHAR NOT NULL REFERENCES "WhatsApp_Manager"."whatsapp_broadcasts"(id) ON DELETE CASCADE,
  whatsapp_customer_id VARCHAR NOT NULL REFERENCES "WhatsApp_Manager"."whatsapp_customers"(id) ON DELETE CASCADE,

  -- Linked message
  message_id VARCHAR REFERENCES "WhatsApp_Manager"."whatsapp_messages"(id) ON DELETE SET NULL,

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMP,
  delivered_at TIMESTAMP,
  read_at TIMESTAMP,
  error TEXT
);

CREATE INDEX IF NOT EXISTS idx_broadcast_recipients_broadcast ON "WhatsApp_Manager"."whatsapp_broadcast_recipients"(broadcast_id);
CREATE INDEX IF NOT EXISTS idx_broadcast_recipients_customer ON "WhatsApp_Manager"."whatsapp_broadcast_recipients"(whatsapp_customer_id);

-- ============================================================================
-- GRANTS (if using RLS in Supabase)
-- ============================================================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA "WhatsApp_Manager" TO postgres, anon, authenticated, service_role;

-- Grant all privileges on tables
GRANT ALL ON ALL TABLES IN SCHEMA "WhatsApp_Manager" TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA "WhatsApp_Manager" TO postgres, anon, authenticated, service_role;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON SCHEMA "WhatsApp_Manager" IS 'WhatsApp bot and conversation management system';
COMMENT ON TABLE "WhatsApp_Manager"."whatsapp_customers" IS 'Links WhatsApp users to CRM customers';
COMMENT ON TABLE "WhatsApp_Manager"."whatsapp_conversations" IS 'Tracks conversations with customers';
COMMENT ON TABLE "WhatsApp_Manager"."whatsapp_messages" IS 'Stores all WhatsApp messages with pricing tracking';
COMMENT ON TABLE "WhatsApp_Manager"."whatsapp_templates" IS 'Meta-approved message templates';
COMMENT ON TABLE "WhatsApp_Manager"."whatsapp_broadcasts" IS 'Marketing broadcast campaigns';
COMMENT ON TABLE "WhatsApp_Manager"."whatsapp_broadcast_recipients" IS 'Individual broadcast delivery tracking';
