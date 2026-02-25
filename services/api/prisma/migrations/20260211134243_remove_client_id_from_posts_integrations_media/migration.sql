-- Remove clientId from posts, integrations, and media tables
-- This migration removes the multi-tenant client functionality

-- Remove clientId from posts table
ALTER TABLE "posts" DROP CONSTRAINT IF EXISTS "posts_client_id_fkey";
DROP INDEX IF EXISTS "posts_client_id_idx";
ALTER TABLE "posts" DROP COLUMN IF EXISTS "client_id";

-- Remove clientId from integrations table
ALTER TABLE "integrations" DROP CONSTRAINT IF EXISTS "integrations_client_id_fkey";
DROP INDEX IF EXISTS "integrations_client_id_idx";
ALTER TABLE "integrations" DROP COLUMN IF EXISTS "client_id";

-- Remove clientId from media table
ALTER TABLE "media" DROP CONSTRAINT IF EXISTS "media_client_id_fkey";
DROP INDEX IF EXISTS "media_client_id_idx";
ALTER TABLE "media" DROP COLUMN IF EXISTS "client_id";
