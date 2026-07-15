export type BrandBrief = {
  summary: string;
  audience: string;
  voice: string;
  usp: string;
  channels: string[];
  keywords: string[];
  analyzedAt: string;
  source: "ai" | "heuristic";
};

export type BriefInput = {
  name: string;
  description: string;
  websiteUrl?: string | null;
  notes?: string | null;
};

function heuristicBrief(input: BriefInput): BrandBrief {
  const bits = [input.description, input.notes].filter(Boolean).join(" ");
  const words = bits
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 4);
  const keywords = [...new Set(words)].slice(0, 8);

  return {
    summary: bits
      ? `${input.name}: ${bits.slice(0, 220)}${bits.length > 220 ? "…" : ""}`
      : `${input.name} is ready for a multi-channel launch campaign.`,
    audience:
      "Early adopters and people already following related Comfybear-style products.",
    voice: "Warm, clear, and confident — helpful without hype.",
    usp: input.description?.slice(0, 160) || `Marketing for ${input.name} on autopilot.`,
    channels: ["Social", "Email", "Content", "SEO"],
    keywords: keywords.length ? keywords : [slugKeyword(input.name)],
    analyzedAt: new Date().toISOString(),
    source: "heuristic",
  };
}

function slugKeyword(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "brand";
}

export async function analyzeBrief(input: BriefInput): Promise<BrandBrief> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return heuristicBrief(input);
  }

  try {
    const Anthropic = (await import("@anthropic-ai/sdk")).default;
    const client = new Anthropic({
      apiKey,
      timeout: 30_000,
      maxRetries: 1,
    });
    const model =
      process.env.ANTHROPIC_MODEL?.trim() || "claude-sonnet-4-6";

    const prompt = `You are a marketing strategist for ComfyMart. Analyze this project and return ONLY valid JSON (no markdown) with keys:
summary (string, 1-2 sentences),
audience (string),
voice (string — tone/brand voice),
usp (string — unique selling point),
channels (string[] — pick from Social, Email, Content, SEO, Community),
keywords (string[] — 5-10 short keywords).

Project name: ${input.name}
Website: ${input.websiteUrl || "(none)"}
Description: ${input.description}
Extra notes: ${input.notes || "(none)"}`;

    const message = await client.messages.create({
      model,
      max_tokens: 800,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content
      .filter((b: { type: string }) => b.type === "text")
      .map((b: { type: string; text?: string }) =>
        "text" in b ? (b.text ?? "") : "",
      )
      .join("")
      .trim();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return heuristicBrief(input);

    const parsed = JSON.parse(jsonMatch[0]) as Partial<BrandBrief>;
    return {
      summary: String(parsed.summary ?? heuristicBrief(input).summary),
      audience: String(parsed.audience ?? heuristicBrief(input).audience),
      voice: String(parsed.voice ?? heuristicBrief(input).voice),
      usp: String(parsed.usp ?? heuristicBrief(input).usp),
      channels: Array.isArray(parsed.channels)
        ? parsed.channels.map(String).slice(0, 8)
        : ["Social", "Email", "Content", "SEO"],
      keywords: Array.isArray(parsed.keywords)
        ? parsed.keywords.map(String).slice(0, 12)
        : heuristicBrief(input).keywords,
      analyzedAt: new Date().toISOString(),
      source: "ai",
    };
  } catch {
    return heuristicBrief(input);
  }
}
