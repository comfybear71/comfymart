import Link from "next/link";
import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { withUser } from "@/lib/db/client";
import { campaigns, campaignItems, projects } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import CampaignStudio from "@/components/CampaignStudio";

export default async function CampaignStudioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;

  const data = await withUser(session.user.id, async (tx) => {
    const [campaign] = await tx
      .select({
        id: campaigns.id,
        name: campaigns.name,
        status: campaigns.status,
        playbook: campaigns.playbook,
        projectId: campaigns.projectId,
        projectName: projects.name,
        websiteUrl: projects.websiteUrl,
      })
      .from(campaigns)
      .innerJoin(projects, eq(projects.id, campaigns.projectId))
      .where(eq(campaigns.id, id))
      .limit(1);

    if (!campaign) return null;

    const items = await tx
      .select({
        id: campaignItems.id,
        channel: campaignItems.channel,
        title: campaignItems.title,
        body: campaignItems.body,
        dayOffset: campaignItems.dayOffset,
        status: campaignItems.status,
        scheduledFor: campaignItems.scheduledFor,
        publishedAt: campaignItems.publishedAt,
        publishError: campaignItems.publishError,
        metadata: campaignItems.metadata,
      })
      .from(campaignItems)
      .where(eq(campaignItems.campaignId, id))
      .orderBy(asc(campaignItems.dayOffset), asc(campaignItems.createdAt));

    return { campaign, items };
  });

  if (!data) notFound();

  const { campaign, items } = data;

  const studioItems = items.map((item) => {
    const meta =
      item.metadata && typeof item.metadata === "object"
        ? (item.metadata as Record<string, unknown>)
        : {};
    return {
      id: item.id,
      channel: item.channel,
      title: item.title,
      body: item.body,
      dayOffset: item.dayOffset,
      status: item.status,
      scheduledFor: item.scheduledFor,
      publishedAt: item.publishedAt,
      publishError: item.publishError,
      publishDetail:
        typeof meta.publishDetail === "string" ? meta.publishDetail : null,
      commitSha: typeof meta.commitSha === "string" ? meta.commitSha : null,
      liveUrl: typeof meta.liveUrl === "string" ? meta.liveUrl : null,
      videoUrl: typeof meta.videoUrl === "string" ? meta.videoUrl : null,
      projectName: campaign.projectName,
      websiteUrl: campaign.websiteUrl,
    };
  });

  return (
    <div>
      <div className="mb-8">
        <Link
          href={`/dashboard/projects/${campaign.projectId}`}
          className="text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
        >
          ← {campaign.projectName}
        </Link>
        <p className="mt-4 text-sm font-medium uppercase tracking-wider text-[var(--color-muted-foreground)]">
          Content studio
        </p>
        <h1 className="mt-2 text-balance text-3xl font-semibold tracking-tight md:text-4xl">
          {campaign.name}
        </h1>
      </div>

      <CampaignStudio
        initialItems={studioItems}
        projectId={campaign.projectId}
        projectName={campaign.projectName}
        websiteUrl={campaign.websiteUrl}
      />
    </div>
  );
}
