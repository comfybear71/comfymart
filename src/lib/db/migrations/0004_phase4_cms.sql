-- Phase 4 founder path: CMS sync columns + notify email + cron helper.

ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "cms_provider" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "cms_repo" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "cms_branch" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "cms_guides_path" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "notify_email" text;--> statement-breakpoint

-- Cron (no session): list due scheduled email items bypassing RLS.
-- Updates still go through withUser(created_by) in the API route.
CREATE OR REPLACE FUNCTION due_scheduled_email_items()
RETURNS TABLE (
  item_id uuid,
  title text,
  body text,
  day_offset integer,
  campaign_id uuid,
  project_id uuid,
  project_name text,
  notify_email text,
  created_by text
) AS $$
  SELECT
    ci.id,
    ci.title,
    ci.body,
    ci.day_offset,
    c.id,
    p.id,
    p.name,
    COALESCE(NULLIF(TRIM(p.notify_email), ''), u.email),
    c.created_by
  FROM campaign_items ci
  INNER JOIN campaigns c ON c.id = ci.campaign_id
  INNER JOIN projects p ON p.id = c.project_id
  INNER JOIN users u ON u.id = c.created_by
  WHERE ci.channel = 'email'
    AND ci.status = 'scheduled'
    AND ci.scheduled_for IS NOT NULL
    AND ci.scheduled_for <= NOW();
$$ LANGUAGE sql STABLE SECURITY DEFINER;
