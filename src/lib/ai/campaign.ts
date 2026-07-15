import type { BrandBrief } from "@/lib/ai/brief";

export type GeneratedCampaignItem = {
  channel: "social" | "email" | "content" | "seo" | "community";
  title: string;
  body: string;
  dayOffset: number;
  metadata?: Record<string, unknown>;
};

export type GeneratedCampaign = {
  name: string;
  items: GeneratedCampaignItem[];
};

const CHANNELS = ["social", "email", "content", "seo", "community"] as const;
const AI_TIMEOUT_MS = 45_000;

function heuristicCampaign(
  projectName: string,
  brief: BrandBrief,
): GeneratedCampaign {
  const voice = brief.voice || "Warm and clear";
  const usp = brief.usp || projectName;
  return {
    name: `${projectName} — 14-day launch`,
    items: [
      {
        channel: "social",
        title: "Launch post — meet the product",
        body: `${projectName} is live. ${usp}\n\nBuilt for: ${brief.audience}\nTone: ${voice}\n\n(Ready for approval — human gate on.)`,
        dayOffset: 0,
        metadata: { platform: "linkedin" },
      },
      {
        channel: "social",
        title: "Thread / carousel — why it matters",
        body: `1/ ${brief.summary}\n2/ Who it's for: ${brief.audience}\n3/ What makes it different: ${usp}\n4/ Soft CTA — visit the site / reply with questions.`,
        dayOffset: 2,
        metadata: { platform: "x" },
      },
      {
        channel: "email",
        title: "Welcome email — Day 0",
        body: `Subject: Welcome to ${projectName}\n\nHey — thanks for being here.\n\n${brief.summary}\n\nNext: we'll share how to get the most out of it. Reply anytime.\n\n— ${projectName}`,
        dayOffset: 0,
      },
      {
        channel: "email",
        title: "Value email — Day 3",
        body: `Subject: One thing ${projectName} does differently\n\n${usp}\n\nVoice note: ${voice}\n\nCTA: Check the latest update on the site.`,
        dayOffset: 3,
      },
      {
        channel: "content",
        title: "Short blog outline",
        body: `Title idea: How ${projectName} helps ${brief.audience}\n\nOutline:\n- The problem\n- Why existing options fall short\n- How ${projectName} works\n- Proof / next step\n\nKeywords: ${(brief.keywords || []).slice(0, 5).join(", ")}`,
        dayOffset: 5,
      },
      {
        channel: "seo",
        title: "Landing SEO brief",
        body: `Primary intent: people searching for solutions related to ${projectName}.\nTarget phrases: ${(brief.keywords || []).slice(0, 6).join(", ")}\nH1 angle: ${usp}\nMeta description draft: ${brief.summary.slice(0, 150)}`,
        dayOffset: 1,
      },
      {
        channel: "community",
        title: "Community intro post",
        body: `Quick intro for relevant communities:\n\nWe're ${projectName}. ${brief.summary}\n\nHonest question for the room — what's the biggest pain in this space right now?\n\n(No spammy hard sell; invite conversation.)`,
        dayOffset: 4,
      },
      {
        channel: "social",
        title: "Social proof / soft reminder",
        body: `Reminder post: ${projectName} — ${usp}\n\nFor ${brief.audience}.\nHuman approval required before publish.`,
        dayOffset: 7,
      },
    ],
  };
}

function normalizeItems(raw: unknown): GeneratedCampaignItem[] {
  if (!Array.isArray(raw)) return [];
  const out: GeneratedCampaignItem[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    const channel = String(r.channel ?? "").toLowerCase();
    if (!CHANNELS.includes(channel as (typeof CHANNELS)[number])) continue;
    const title = String(r.title ?? "").trim();
    const body = String(r.body ?? "").trim();
    if (!title || !body) continue;
    const dayOffset = Number(r.dayOffset ?? r.day_offset ?? 0);
    out.push({
      channel: channel as GeneratedCampaignItem["channel"],
      title: title.slice(0, 200),
      body: body.slice(0, 4000),
      dayOffset: Number.isFinite(dayOffset)
        ? Math.max(0, Math.min(30, dayOffset))
        : 0,
      metadata:
        r.metadata && typeof r.metadata === "object"
          ? (r.metadata as Record<string, unknown>)
          : undefined,
    });
  }
  return out;
}

async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label: string,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error(`${label} timed out after ${ms}ms`)),
          ms,
        );
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function generateCampaignPlan(input: {
  projectName: string;
  websiteUrl?: string | null;
  brief: BrandBrief;
  playbook?: string;
}): Promise<GeneratedCampaign> {
  const playbook = input.playbook ?? "startup_launch";
  const fallback = heuristicCampaign(input.projectName, input.brief);
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return fallback;

  try {
    const Anthropic = (await import("@anthropic-ai/sdk")).default;
    const client = new Anthropic({
      apiKey,
      timeout: AI_TIMEOUT_MS,
      maxRetries: 1,
    });
    const model =
      process.env.ANTHROPIC_MODEL?.trim() || "claude-sonnet-4-6";

    const prompt = `You are ComfyMart's campaign planner. Return ONLY valid JSON (no markdown) with shape:
{
  "name": string,
  "items": [
    {
      "channel": "social" | "email" | "content" | "seo" | "community",
      "title": string,
      "body": string,
      "dayOffset": number (0-14),
      "metadata": object (optional)
    }
  ]
}

Rules:
- Playbook: ${playbook}
- Generate exactly 8 items across channels, brand-safe, ready for human approval.
- Keep each body under 120 words. No fake metrics or invented testimonials.
- Social bodies should be post-ready; email bodies include Subject line on first line.
- Project: ${input.projectName}
- Website: ${input.websiteUrl || "(none)"}
- Brief summary: ${input.brief.summary}
- Audience: ${input.brief.audience}
- Voice: ${input.brief.voice}
- USP: ${input.brief.usp}
- Channels preferred: ${(input.brief.channels || []).join(", ")}
- Keywords: ${(input.brief.keywords || []).join(", ")}`;

    const message = await withTimeout(
      client.messages.create({
        model,
        max_tokens: 2500,
        messages: [{ role: "user", content: prompt }],
      }),
      AI_TIMEOUT_MS,
      "Anthropic campaign generation",
    );

    const text = message.content
      .filter((b) => b.type === "text")
      .map((b) => ("text" in b ? b.text : ""))
      .join("")
      .trim();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return fallback;

    const parsed = JSON.parse(jsonMatch[0]) as {
      name?: string;
      items?: unknown;
    };
    const items = normalizeItems(parsed.items);
    if (items.length < 4) return fallback;

    return {
      name: String(parsed.name ?? fallback.name).slice(0, 120),
      items,
    };
  } catch (err) {
    console.error("[generateCampaignPlan] falling back:", err);
    return fallback;
  }
}
