import { NextResponse } from "next/server";
import { db, withUser } from "@/lib/db/client";
import { campaignItems } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { publishEmailItem } from "@/lib/publish/channels";

export const runtime = "nodejs";
export const maxDuration = 120;

type DueRow = {
  item_id: string;
  title: string;
  body: string;
  day_offset: number;
  campaign_id: string;
  project_id: string;
  project_name: string;
  notify_email: string | null;
  created_by: string;
};

function authorizeCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth === `Bearer ${secret}`) return true;
  }
  // Vercel Cron sends this header on scheduled invocations.
  if (request.headers.get("x-vercel-cron") === "1") return true;
  // Local/dev convenience when CRON_SECRET unset.
  if (!secret && process.env.NODE_ENV === "development") return true;
  return false;
}

function mergeMeta(existing: unknown, extra: Record<string, unknown>) {
  const base =
    existing && typeof existing === "object"
      ? (existing as Record<string, unknown>)
      : {};
  return { ...base, ...extra };
}

export async function GET(request: Request) {
  if (!authorizeCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await db.execute(
      sql`SELECT * FROM due_scheduled_email_items()`,
    );
    const rawRows = Array.isArray(result)
      ? result
      : Array.isArray((result as { rows?: unknown }).rows)
        ? ((result as { rows: Record<string, unknown>[] }).rows ?? [])
        : [];
    const list = rawRows as unknown as DueRow[];

    const outcomes: Array<{
      id: string;
      status: string;
      detail?: string;
      error?: string;
    }> = [];

    for (const row of list) {
      const toEmail = row.notify_email?.trim();
      if (!toEmail) {
        await withUser(row.created_by, async (tx) => {
          await tx
            .update(campaignItems)
            .set({
              status: "failed",
              publishError: "No notifyEmail or user email for recipient.",
              updatedAt: new Date(),
            })
            .where(eq(campaignItems.id, row.item_id));
        });
        outcomes.push({
          id: row.item_id,
          status: "failed",
          error: "No recipient email",
        });
        continue;
      }

      const sent = await publishEmailItem({
        title: row.title,
        body: row.body,
        toEmail,
      });

      if (!sent.ok) {
        await withUser(row.created_by, async (tx) => {
          await tx
            .update(campaignItems)
            .set({
              status: "failed",
              publishError: sent.error ?? "Email send failed",
              updatedAt: new Date(),
            })
            .where(eq(campaignItems.id, row.item_id));
        });
        outcomes.push({
          id: row.item_id,
          status: "failed",
          error: sent.error,
        });
        continue;
      }

      await withUser(row.created_by, async (tx) => {
        const [current] = await tx
          .select({ metadata: campaignItems.metadata })
          .from(campaignItems)
          .where(eq(campaignItems.id, row.item_id))
          .limit(1);

        await tx
          .update(campaignItems)
          .set({
            status: "published",
            publishedAt: new Date(),
            publishError: null,
            externalId: sent.externalId ?? null,
            metadata: mergeMeta(current?.metadata, {
              publishMode: sent.mode,
              publishDetail: sent.detail ?? `Email sent to ${toEmail}`,
              cronSent: true,
            }),
            updatedAt: new Date(),
          })
          .where(eq(campaignItems.id, row.item_id));
      });

      outcomes.push({
        id: row.item_id,
        status: "published",
        detail: sent.detail,
      });
    }

    return NextResponse.json({
      ok: true,
      processed: outcomes.length,
      published: outcomes.filter((o) => o.status === "published").length,
      failed: outcomes.filter((o) => o.status === "failed").length,
      results: outcomes,
    });
  } catch (err) {
    console.error("[api/cron/send-emails]", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Cron email send failed.",
      },
      { status: 500 },
    );
  }
}
