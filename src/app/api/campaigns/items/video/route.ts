import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { withUser } from "@/lib/db/client";
import { campaignItems, campaigns, projects } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { generateContentVideo } from "@/lib/ai/video";
import type { BrandBrief } from "@/lib/ai/brief";

export const runtime = "nodejs";
export const maxDuration = 300;

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
  const itemId = typeof obj.itemId === "string" ? obj.itemId : null;
  if (!itemId) {
    return NextResponse.json({ error: "itemId required." }, { status: 400 });
  }

  try {
    const row = await withUser(userId, async (tx) => {
      const [r] = await tx
        .select({
          item: campaignItems,
          projectName: projects.name,
          brandTone: projects.brandTone,
          websiteUrl: projects.websiteUrl,
        })
        .from(campaignItems)
        .innerJoin(campaigns, eq(campaigns.id, campaignItems.campaignId))
        .innerJoin(projects, eq(projects.id, campaigns.projectId))
        .where(and(eq(campaignItems.id, itemId)))
        .limit(1);
      return r ?? null;
    });

    if (!row) {
      return NextResponse.json({ error: "Item not found." }, { status: 404 });
    }

    if (row.item.channel !== "content" && row.item.channel !== "seo") {
      return NextResponse.json(
        { error: "Video generation is for Content (or SEO) items." },
        { status: 400 },
      );
    }

    const brief = row.brandTone as BrandBrief | null;
    const meta =
      row.item.metadata && typeof row.item.metadata === "object"
        ? (row.item.metadata as Record<string, unknown>)
        : {};
    const existingImage =
      typeof meta.imageUrl === "string"
        ? meta.imageUrl
        : Array.isArray(meta.mediaUrls) && typeof meta.mediaUrls[0] === "string"
          ? meta.mediaUrls[0]
          : null;

    const result = await generateContentVideo({
      projectName: row.projectName,
      script: row.item.body,
      title: row.item.title,
      imageUrl: existingImage,
      hook: brief?.usp ?? brief?.summary ?? null,
    });

    if (!result.ok || !result.videoUrl) {
      return NextResponse.json(
        { error: result.error ?? "Video generation failed." },
        { status: 502 },
      );
    }

    await withUser(userId, async (tx) => {
      await tx
        .update(campaignItems)
        .set({
          metadata: mergeMeta(row.item.metadata, {
            videoUrl: result.videoUrl,
            imageUrl: result.imageUrl ?? existingImage,
            videoRequestId: result.requestId,
            videoDetail: result.detail,
          }),
          updatedAt: new Date(),
        })
        .where(eq(campaignItems.id, itemId));
    });

    return NextResponse.json({
      ok: true,
      itemId,
      videoUrl: result.videoUrl,
      imageUrl: result.imageUrl,
      detail: result.detail,
    });
  } catch (err) {
    console.error("[api/campaigns/items/video]", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Video generation failed unexpectedly.",
      },
      { status: 500 },
    );
  }
}
