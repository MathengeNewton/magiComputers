-- Add type, status, and repair/CRM fields to contact_messages
ALTER TABLE "contact_messages" ADD COLUMN IF NOT EXISTS "type" TEXT NOT NULL DEFAULT 'contact';
ALTER TABLE "contact_messages" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'new';
ALTER TABLE "contact_messages" ADD COLUMN IF NOT EXISTS "email" TEXT;
ALTER TABLE "contact_messages" ADD COLUMN IF NOT EXISTS "device_type" TEXT;
ALTER TABLE "contact_messages" ADD COLUMN IF NOT EXISTS "issue_summary" TEXT;
ALTER TABLE "contact_messages" ADD COLUMN IF NOT EXISTS "internal_note" TEXT;
ALTER TABLE "contact_messages" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS "contact_messages_type_idx" ON "contact_messages"("type");
CREATE INDEX IF NOT EXISTS "contact_messages_status_idx" ON "contact_messages"("status");
