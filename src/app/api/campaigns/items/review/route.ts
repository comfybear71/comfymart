import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { withUser } from "@/lib/db/client";
import { campaignItems } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { suggestSendAt } from "@/lib/publish/optimal-time";

export const runtime = "nodejs";

type Decision = "approved" | "rejected";

export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const obj = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const decision = obj.decision === "approved" || obj.decision === "rejected"
    ? (obj.decision as Decision)
    : null;

  const itemIds: string[] = Array.isArray(obj.itemIds)
    ? obj.itemIds.filter((id): id is string => typeof id === "string")
    : typeof obj.itemId === "string"
      ? [obj.itemId]
      : [];

  if (!decision || itemIds.length === 0) {
    return NextResponse.json(
      { error: "itemId(s) and decision (approved|rejected) required." },
      { status: 400 },
    );
  }

  try {
    const updated = await withUser(userId, async (tx) => {
      const rows = await tx
        .select({
          id: campaignItems.id,
          status: campaignItems.status,
          channel: campaignItems.channel,
          dayOffset: campaignItems.dayOffset,
          scheduledFor: campaignItems.scheduledFor,
          campaignId: campaignItems.campaignId,
        })
        .from(campaignItems)
        .where(inArray(campaignItems.id, itemIds));

      if (rows.length === 0) {
        throw new Error("No items found.");
      }

      const pending = rows.filter((r) => r.status === "pending_approval");
      if (pending.length === 0) {
        return {
          count: 0,
          campaignId: rows[0].campaignId,
          results: [] as Array<{
            id: string;
            status: string;
            scheduledFor?: string | null;
          }>,
        };
      }

      const now = new Date();
      const results: Array<{
        id: string;
        status: string;
        scheduledFor?: string | null;
      }> = [];

      for (const row of pending) {
        const patch: {
          status: Decision | "scheduled";
          reviewedAt: Date;
          reviewedBy: string;
          updatedAt: Date;
          scheduledFor?: Date | null;
        } = {
          status: decision,
          reviewedAt: now,
          reviewedBy: userId,
          updatedAt: now,
        };

        // Email sequences: on approve, set scheduledFor from dayOffset when missing.
        if (decision === "approved" && row.channel === "email" && !row.scheduledFor) {
          const when = suggestSendAt({
            dayOffset: row.dayOffset,
            channel: "email",
          });
          // If the suggested time is still in the future, queue for cron.
          if (when.getTime() > Date.now() + 60_000) {
            patch.status = "scheduled";
            patch.scheduledFor = when;
          } else {
            patch.scheduledFor = when;
          }
        }

        await tx
          .update(campaignItems)
          .set(patch)
          .where(
            and(
              eq(campaignItems.id, row.id),
              eq(campaignItems.status, "pending_approval"),
            ),
          );

        results.push({
          id: row.id,
          status: patch.status,
          scheduledFor: patch.scheduledFor?.toISOString() ?? null,
        });
      }

      return { count: pending.length, campaignId: rows[0].campaignId, results };
    });

    return NextResponse.json({
      ok: true,
      updated: updated.count,
      campaignId: updated.campaignId,
      decision,
      itemIds,
      results: updated.results,
    });
  } catch (err) {
    console.error("[api/campaigns/items/review]", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Could not update item status.",
      },
      { status: 500 },
    );
  }
}
