-- Campaigns + content items (Phase 2) with RLS via project membership.

CREATE TYPE "public"."campaign_status" AS ENUM('draft', 'generating', 'ready', 'archived');--> statement-breakpoint
CREATE TYPE "public"."campaign_item_status" AS ENUM('draft', 'pending_approval', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."campaign_channel" AS ENUM('social', 'email', 'content', 'seo', 'community');--> statement-breakpoint

CREATE TABLE "campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"name" text NOT NULL,
	"playbook" text DEFAULT 'startup_launch' NOT NULL,
	"status" "campaign_status" DEFAULT 'draft' NOT NULL,
	"brief_snapshot" jsonb,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint

CREATE TABLE "campaign_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"channel" "campaign_channel" NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"day_offset" integer DEFAULT 0 NOT NULL,
	"status" "campaign_item_status" DEFAULT 'pending_approval' NOT NULL,
	"metadata" jsonb,
	"reviewed_at" timestamp,
	"reviewed_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint

ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_items" ADD CONSTRAINT "campaign_items_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_items" ADD CONSTRAINT "campaign_items_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint

CREATE INDEX "campaigns_project_idx" ON "campaigns" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "campaign_items_campaign_idx" ON "campaign_items" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "campaign_items_status_idx" ON "campaign_items" USING btree ("status");--> statement-breakpoint

-- Helper: is the current user a member of the org that owns this project?
CREATE OR REPLACE FUNCTION is_project_member(_project_id uuid) RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = _project_id
      AND is_org_member(p.org_id)
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;--> statement-breakpoint

CREATE OR REPLACE FUNCTION is_campaign_member(_campaign_id uuid) RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM campaigns c
    WHERE c.id = _campaign_id
      AND is_project_member(c.project_id)
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;--> statement-breakpoint

ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE campaigns FORCE ROW LEVEL SECURITY;--> statement-breakpoint

CREATE POLICY campaigns_select ON campaigns
  FOR SELECT USING (is_project_member(project_id));--> statement-breakpoint

CREATE POLICY campaigns_insert ON campaigns
  FOR INSERT WITH CHECK (
    is_project_member(project_id) AND created_by = app_current_user_id()
  );--> statement-breakpoint

CREATE POLICY campaigns_update ON campaigns
  FOR UPDATE USING (is_project_member(project_id))
  WITH CHECK (is_project_member(project_id));--> statement-breakpoint

CREATE POLICY campaigns_delete ON campaigns
  FOR DELETE USING (is_project_member(project_id));--> statement-breakpoint

ALTER TABLE campaign_items ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE campaign_items FORCE ROW LEVEL SECURITY;--> statement-breakpoint

CREATE POLICY campaign_items_select ON campaign_items
  FOR SELECT USING (is_campaign_member(campaign_id));--> statement-breakpoint

CREATE POLICY campaign_items_insert ON campaign_items
  FOR INSERT WITH CHECK (is_campaign_member(campaign_id));--> statement-breakpoint

CREATE POLICY campaign_items_update ON campaign_items
  FOR UPDATE USING (is_campaign_member(campaign_id))
  WITH CHECK (is_campaign_member(campaign_id));--> statement-breakpoint

CREATE POLICY campaign_items_delete ON campaign_items
  FOR DELETE USING (is_campaign_member(campaign_id));
