import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { withUser } from "@/lib/db/client";
import { campaignItems } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { suggestSendAt } from "@/lib/publish/optimal-time";
import {
  publishEmailItem,
  publishSocialItem,
  publishInternalItem,
} from "@/lib/publish/channels";

export const runtime = "nodejs";
export const maxDuration = 60;

type Mode = "now" | "schedule";

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
  const mode: Mode = obj.mode === "schedule" ? "schedule" : "now";
  const itemIds: string[] = Array.isArray(obj.itemIds)
    ? obj.itemIds.filter((id): id is string => typeof id === "string")
    : typeof obj.itemId === "string"
      ? [obj.itemId]
      : [];

  if (itemIds.length === 0) {
    return NextResponse.json({ error: "itemId(s) required." }, { status: 400 });
  }

  const toEmail = session.user?.email;
  if (!toEmail && itemIds.length) {
    // email channel needs an address; checked per-item below
  }

  try {
    const rows = await withUser(userId, async (tx) => {
      return tx
        .select()
        .from(campaignItems)
        .where(
          and(
            inArray(campaignItems.id, itemIds),
            inArray(campaignItems.status, ["approved", "failed", "scheduled"]),
          ),
        );
    });

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "No approved items found to publish." },
        { status: 404 },
      );
    }

    const results: Array<{
      id: string;
      status: string;
      mode?: string;
      detail?: string;
      error?: string;
      scheduledFor?: string;
    }> = [];

    for (const item of rows) {
      const when = suggestSendAt({
        dayOffset: item.dayOffset,
        channel: item.channel,
      });

      if (mode === "schedule" && when.getTime() > Date.now() + 60_000) {
        await withUser(userId, async (tx) => {
          await tx
            .update(campaignItems)
            .set({
              status: "scheduled",
              scheduledFor: when,
              publishError: null,
              updatedAt: new Date(),
            })
            .where(eq(campaignItems.id, item.id));
        });

        // Live social schedule via Ayrshare when key present
        if (item.channel === "social" && process.env.AYRSHARE_API_KEY) {
          const social = await publishSocialItem({
            body: item.body,
            scheduleDate: when,
            platforms: metaPlatforms(item.metadata),
          });
          if (!social.ok) {
            await withUser(userId, async (tx) => {
              await tx
                .update(campaignItems)
                .set({
                  status: "failed",
                  publishError: social.error ?? "Schedule failed",
                  updatedAt: new Date(),
                })
                .where(eq(campaignItems.id, item.id));
            });
            results.push({
              id: item.id,
              status: "failed",
              error: social.error,
            });
            continue;
          }
          await withUser(userId, async (tx) => {
            await tx
              .update(campaignItems)
              .set({
                externalId: social.externalId ?? null,
                metadata: mergeMeta(item.metadata, {
                  publishMode: social.mode,
                  publishDetail: social.detail,
                }),
                updatedAt: new Date(),
              })
              .where(eq(campaignItems.id, item.id));
          });
        }

        results.push({
          id: item.id,
          status: "scheduled",
          detail: `Scheduled for ${when.toLocaleString()}`,
          scheduledFor: when.toISOString(),
        });
        continue;
      }

      // Publish now
      let outcome;
      if (item.channel === "email") {
        if (!toEmail) {
          outcome = {
            ok: false as const,
            mode: "live" as const,
            error: "No email on your account to send to.",
          };
        } else {
          outcome = await publishEmailItem({
            title: item.title,
            body: item.body,
            toEmail,
          });
        }
      } else if (item.channel === "social" || item.channel === "community") {
        outcome = await publishSocialItem({
          body: item.body,
          platforms: metaPlatforms(item.metadata),
        });
      } else {
        outcome = await publishInternalItem({
          channel: item.channel,
          title: item.title,
        });
      }

      if (!outcome.ok) {
        await withUser(userId, async (tx) => {
          await tx
            .update(campaignItems)
            .set({
              status: "failed",
              publishError: outcome.error ?? "Publish failed",
              updatedAt: new Date(),
            })
            .where(eq(campaignItems.id, item.id));
        });
        results.push({
          id: item.id,
          status: "failed",
          error: outcome.error,
        });
        continue;
      }

      await withUser(userId, async (tx) => {
        await tx
          .update(campaignItems)
          .set({
            status: "published",
            publishedAt: new Date(),
            scheduledFor: mode === "schedule" ? when : null,
            publishError: null,
            externalId: outcome.externalId ?? null,
            metadata: mergeMeta(item.metadata, {
              publishMode: outcome.mode,
              publishDetail: outcome.detail,
            }),
            updatedAt: new Date(),
          })
          .where(eq(campaignItems.id, item.id));
      });

      results.push({
        id: item.id,
        status: "published",
        mode: outcome.mode,
        detail: outcome.detail,
      });
    }

    const published = results.filter((r) => r.status === "published").length;
    const scheduled = results.filter((r) => r.status === "scheduled").length;
    const failed = results.filter((r) => r.status === "failed").length;

    return NextResponse.json({
      ok: failed === 0,
      published,
      scheduled,
      failed,
      results,
    });
  } catch (err) {
    console.error("[api/campaigns/items/publish]", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Publish failed unexpectedly.",
      },
      { status: 500 },
    );
  }
}

function metaPlatforms(metadata: unknown): string[] | undefined {
  if (!metadata || typeof metadata !== "object") return undefined;
  const platform = (metadata as { platform?: unknown }).platform;
  if (typeof platform === "string" && platform.trim()) {
    const p = platform.trim().toLowerCase();
    // Ayrshare uses "twitter" for X
    if (p === "x") return ["twitter"];
    return [p];
  }
  return undefined;
}

function mergeMeta(existing: unknown, extra: Record<string, unknown>) {
  const base =
    existing && typeof existing === "object"
      ? (existing as Record<string, unknown>)
      : {};
  return { ...base, ...extra };
}
