import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { withUser } from "@/lib/db/client";
import { campaignItems, campaigns, projects } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { suggestSendAt } from "@/lib/publish/optimal-time";
import {
  publishEmailItem,
  publishSocialItem,
  publishDocumentItem,
} from "@/lib/publish/channels";
import { cleanSocialCopy } from "@/lib/publish/copy";
import {
  mediaFromMetadata,
  resolveShareMedia,
} from "@/lib/publish/media";

export const runtime = "nodejs";
export const maxDuration = 120;

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

  const sessionEmail = session.user?.email;

  try {
    const rows = await withUser(userId, async (tx) => {
      return tx
        .select({
          item: campaignItems,
          websiteUrl: projects.websiteUrl,
          projectName: projects.name,
          cmsProvider: projects.cmsProvider,
          cmsRepo: projects.cmsRepo,
          cmsBranch: projects.cmsBranch,
          cmsGuidesPath: projects.cmsGuidesPath,
          notifyEmail: projects.notifyEmail,
        })
        .from(campaignItems)
        .innerJoin(campaigns, eq(campaigns.id, campaignItems.campaignId))
        .innerJoin(projects, eq(projects.id, campaigns.projectId))
        .where(
          and(
            inArray(campaignItems.id, itemIds),
            inArray(campaignItems.status, [
              "approved",
              "failed",
              "scheduled",
              // Allow SEO/Content republish after a download-only "success"
              "published",
            ]),
          ),
        );
    });

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "No approved items found to publish." },
        { status: 404 },
      );
    }

    // Cache share media per project for this request (AI once, then OG fallback)
    const mediaCache = new Map<string, string[]>();
    async function mediaFor(
      websiteUrl: string | null,
      projectName: string,
      metadata: unknown,
    ) {
      const fromMeta = mediaFromMetadata(metadata);
      if (fromMeta.length) return fromMeta;
      const key = `${projectName}|${websiteUrl ?? ""}`;
      if (!mediaCache.has(key)) {
        mediaCache.set(
          key,
          await resolveShareMedia({
            websiteUrl,
            projectName,
            preferAi: true,
          }),
        );
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
      markdown?: string;
      filename?: string;
      commitSha?: string;
      prUrl?: string;
      liveUrl?: string;
    }> = [];

    for (const row of rows) {
      const item = row.item;

      // Published social/email must not be re-sent; SEO/Content may retry CMS push.
      if (
        item.status === "published" &&
        item.channel !== "seo" &&
        item.channel !== "content"
      ) {
        results.push({
          id: item.id,
          status: "published",
          detail: "Already published",
        });
        continue;
      }

      const when = suggestSendAt({
        dayOffset: item.dayOffset,
        channel: item.channel,
      });
      const platforms = resolvePlatforms(item.metadata);
      const mediaUrls = await mediaFor(
        row.websiteUrl,
        row.projectName,
        item.metadata,
      );
      const socialBody = cleanSocialCopy(item.body);
      const toEmail =
        (row.notifyEmail?.trim() || sessionEmail?.trim() || null) ?? null;

      if (mode === "schedule" && when.getTime() > Date.now() + 60_000) {
        // Email sequences: store schedule only; cron sends when due.
        if (item.channel === "email") {
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
          results.push({
            id: item.id,
            status: "scheduled",
            detail: `Email sequence scheduled for ${when.toLocaleString()} → ${toEmail ?? "no recipient yet"}`,
            scheduledFor: when.toISOString(),
          });
          continue;
        }

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

      let outcome: Awaited<ReturnType<typeof publishEmailItem>> & {
        markdown?: string;
        filename?: string;
        commitSha?: string;
        prUrl?: string;
        liveUrl?: string;
      };
      if (item.channel === "email") {
        if (!toEmail) {
          outcome = {
            ok: false,
            mode: "live",
            error: "No notifyEmail on the project or email on your account.",
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
        outcome = await publishDocumentItem({
          channel: item.channel,
          title: item.title,
          body: item.body,
          projectName: row.projectName,
          websiteUrl: row.websiteUrl,
          cms: {
            cmsProvider: row.cmsProvider,
            cmsRepo: row.cmsRepo,
            cmsBranch: row.cmsBranch,
            cmsGuidesPath: row.cmsGuidesPath,
            websiteUrl: row.websiteUrl,
            projectName: row.projectName,
          },
        });
      }

      if (!outcome.ok) {
        await withUser(userId, async (tx) => {
          await tx
            .update(campaignItems)
            .set({
              status: "failed",
              publishError: outcome.error ?? "Publish failed",
              metadata: mergeMeta(item.metadata, {
                publishMode: outcome.mode,
                publishDetail: outcome.detail ?? outcome.error ?? null,
              }),
              updatedAt: new Date(),
            })
            .where(eq(campaignItems.id, item.id));
        });
        results.push({
          id: item.id,
          status: "failed",
          error: outcome.error,
          detail: outcome.detail,
          ...(outcome.markdown && outcome.filename
            ? { markdown: outcome.markdown, filename: outcome.filename }
            : {}),
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
              ...(outcome.filename
                ? { documentFilename: outcome.filename }
                : {}),
              ...(outcome.commitSha ? { commitSha: outcome.commitSha } : {}),
              ...(outcome.prUrl ? { prUrl: outcome.prUrl } : {}),
              ...(outcome.liveUrl ? { liveUrl: outcome.liveUrl } : {}),
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
        ...(outcome.markdown && outcome.filename
          ? { markdown: outcome.markdown, filename: outcome.filename }
          : {}),
        ...(outcome.commitSha ? { commitSha: outcome.commitSha } : {}),
        ...(outcome.prUrl ? { prUrl: outcome.prUrl } : {}),
        ...(outcome.liveUrl ? { liveUrl: outcome.liveUrl } : {}),
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
