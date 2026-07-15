import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { withUser } from "@/lib/db/client";
import { projects, campaigns, campaignItems } from "@/lib/db/schema";
import { analyzeBrief, type BrandBrief } from "@/lib/ai/brief";
import { generateCampaignPlan } from "@/lib/ai/campaign";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";
export const maxDuration = 60;

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

  const projectId =
    typeof body === "object" &&
    body &&
    "projectId" in body &&
    typeof (body as { projectId: unknown }).projectId === "string"
      ? (body as { projectId: string }).projectId
      : null;

  if (!projectId) {
    return NextResponse.json({ error: "projectId is required." }, { status: 400 });
  }

  let project: {
    id: string;
    name: string;
    description: string | null;
    websiteUrl: string | null;
    brandTone: unknown;
  };

  try {
    const row = await withUser(userId, async (tx) => {
      const [p] = await tx
        .select()
        .from(projects)
        .where(eq(projects.id, projectId))
        .limit(1);
      return p ?? null;
    });
    if (!row) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }
    project = row;
  } catch (err) {
    console.error("[api/campaigns/generate:load]", err);
    return NextResponse.json({ error: "Could not load project." }, { status: 500 });
  }

  let brief = project.brandTone as BrandBrief | null;
  if (!brief?.summary) {
    brief = await analyzeBrief({
      name: project.name,
      description: project.description ?? project.name,
      websiteUrl: project.websiteUrl,
    });
  }

  let campaignId: string;
  try {
    campaignId = await withUser(userId, async (tx) => {
      const [campaign] = await tx
        .insert(campaigns)
        .values({
          projectId: project.id,
          name: `${project.name} campaign`,
          playbook: "startup_launch",
          status: "generating",
          briefSnapshot: brief,
          createdBy: userId,
        })
        .returning({ id: campaigns.id });

      if (!campaign?.id) throw new Error("Could not create campaign.");
      return campaign.id;
    });
  } catch (err) {
    console.error("[api/campaigns/generate:create]", err);
    return NextResponse.json(
      { error: "Could not start campaign generation." },
      { status: 500 },
    );
  }

  const plan = await generateCampaignPlan({
    projectName: project.name,
    websiteUrl: project.websiteUrl,
    brief,
  });

  const { resolveProjectMediaUrls } = await import("@/lib/publish/media");
  const mediaUrls = await resolveProjectMediaUrls(project.websiteUrl);

  try {
    await withUser(userId, async (tx) => {
      await tx.insert(campaignItems).values(
        plan.items.map((item) => {
          const needsMedia =
            item.channel === "social" || item.channel === "community";
          const metadata = {
            ...(item.metadata ?? {}),
            ...(needsMedia && mediaUrls.length ? { mediaUrls } : {}),
          };
          return {
            campaignId,
            channel: item.channel,
            title: item.title,
            body: item.body,
            dayOffset: item.dayOffset,
            status: "pending_approval" as const,
            metadata: Object.keys(metadata).length ? metadata : null,
          };
        }),
      );

      await tx
        .update(campaigns)
        .set({
          name: plan.name,
          status: "ready",
          updatedAt: new Date(),
        })
        .where(eq(campaigns.id, campaignId));
    });
  } catch (err) {
    console.error("[api/campaigns/generate:persist]", err);
    try {
      await withUser(userId, async (tx) => {
        await tx
          .update(campaigns)
          .set({ status: "draft", updatedAt: new Date() })
          .where(eq(campaigns.id, campaignId));
      });
    } catch {
      /* ignore */
    }
    return NextResponse.json(
      { error: "Campaign generation failed while saving." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    campaignId,
    itemCount: plan.items.length,
    name: plan.name,
  });
}
