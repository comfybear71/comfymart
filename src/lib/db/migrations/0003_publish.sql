-- Phase 3: publish / schedule fields for approved campaign items.

ALTER TYPE "public"."campaign_item_status" ADD VALUE IF NOT EXISTS 'scheduled';--> statement-breakpoint
ALTER TYPE "public"."campaign_item_status" ADD VALUE IF NOT EXISTS 'published';--> statement-breakpoint
ALTER TYPE "public"."campaign_item_status" ADD VALUE IF NOT EXISTS 'failed';--> statement-breakpoint

ALTER TABLE "campaign_items" ADD COLUMN IF NOT EXISTS "scheduled_for" timestamp;--> statement-breakpoint
ALTER TABLE "campaign_items" ADD COLUMN IF NOT EXISTS "published_at" timestamp;--> statement-breakpoint
ALTER TABLE "campaign_items" ADD COLUMN IF NOT EXISTS "publish_error" text;--> statement-breakpoint
ALTER TABLE "campaign_items" ADD COLUMN IF NOT EXISTS "external_id" text;
