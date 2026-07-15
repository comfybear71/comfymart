import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { withUser } from "@/lib/db/client";
import { campaignItems, campaigns, projects } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { suggestSendAt } from "@/lib/publish/optimal-time";
import {
  publishEmailItem,
  publishSocialItem,
  publishInternalItem,
} from "@/lib/publish/channels";
import { cleanSocialCopy } from "@/lib/publish/copy";
import {
  mediaFromMetadata,
  resolveProjectMediaUrls,
} from "@/lib/publish/media";

export const runtime = "nodejs";
export const maxDuration = 60;

type Mode = "now" | "schedule";

/** Prefer env multi-network list; fall back to item metadata platform. */
function resolvePlatforms(metadata: unknown): string[] | undefined {
  const fromEnv = process.env.AYRSHARE_PLATFORMS?.split(",")
    .map((p) => p.trim().toLowerCase())
    .filter(Boolean);
  if (fromEnv?.length) return fromEnv;

  if (!metadata || typeof metadata !== "object") return undefined;
  const platform = (metadata as { platform?: unknown }).platform;
  if (typeof platform === "string" && platform.trim()) {
    const p = platform.trim().toLowerCase();
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

  try {
    const rows = await withUser(userId, async (tx) => {
      return tx
        .select({
          item: campaignItems,
          websiteUrl: projects.websiteUrl,
          projectName: projects.name,
        })
        .from(campaignItems)
        .innerJoin(campaigns, eq(campaigns.id, campaignItems.campaignId))
        .innerJoin(projects, eq(projects.id, campaigns.projectId))
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

    // Cache OG media per project website for this request
    const mediaCache = new Map<string, string[]>();
    async function mediaFor(websiteUrl: string | null, metadata: unknown) {
      const fromMeta = mediaFromMetadata(metadata);
      if (fromMeta.length) return fromMeta;
      const key = websiteUrl ?? "";
      if (!mediaCache.has(key)) {
        mediaCache.set(key, await resolveProjectMediaUrls(websiteUrl));
      }
      return mediaCache.get(key) ?? [];
    }

    const results: Array<{
      id: string;
      status: string;
      mode?: string;
      detail?: string;
      error?: string;
      scheduledFor?: string;
    }> = [];

    for (const row of rows) {
      const item = row.item;
      const when = suggestSendAt({
        dayOffset: item.dayOffset,
        channel: item.channel,
      });
      const platforms = resolvePlatforms(item.metadata);
      const mediaUrls = await mediaFor(row.websiteUrl, item.metadata);
      const socialBody = cleanSocialCopy(item.body);

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

        if (
          (item.channel === "social" || item.channel === "community") &&
          process.env.AYRSHARE_API_KEY
        ) {
          const social = await publishSocialItem({
            body: socialBody,
            scheduleDate: when,
            platforms,
            mediaUrls,
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
                  mediaUrls,
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
          body: socialBody,
          platforms,
          mediaUrls,
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
              mediaUrls,
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
