import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { withUser } from "@/lib/db/client";
import { campaignItems } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";

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
          campaignId: campaignItems.campaignId,
        })
        .from(campaignItems)
        .where(inArray(campaignItems.id, itemIds));

      if (rows.length === 0) {
        throw new Error("No items found.");
      }

      const pendingIds = rows
        .filter((r) => r.status === "pending_approval")
        .map((r) => r.id);

      if (pendingIds.length === 0) {
        return { count: 0, campaignId: rows[0].campaignId };
      }

      await tx
        .update(campaignItems)
        .set({
          status: decision,
          reviewedAt: new Date(),
          reviewedBy: userId,
          updatedAt: new Date(),
        })
        .where(
          and(
            inArray(campaignItems.id, pendingIds),
            eq(campaignItems.status, "pending_approval"),
          ),
        );

      return { count: pendingIds.length, campaignId: rows[0].campaignId };
    });

    return NextResponse.json({
      ok: true,
      updated: updated.count,
      campaignId: updated.campaignId,
      decision,
      itemIds,
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
