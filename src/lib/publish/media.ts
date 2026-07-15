import { generateShareImage } from "@/lib/ai/imagine";

/** Resolve publicly reachable image URLs for social posts (Instagram etc.). */

export type ResolveShareMediaInput = {
  websiteUrl?: string | null;
  projectName: string;
  /** Brand USP / summary for Grok Imagine prompt. */
  hook?: string | null;
  /** Prefer AI-generated creatives when XAI_API_KEY is set. */
  preferAi?: boolean;
};

/**
 * Prefer Grok Imagine (durable Blob URL when configured), then site OG image.
 */
export async function resolveShareMedia(
  input: ResolveShareMediaInput,
): Promise<string[]> {
  if (input.preferAi !== false) {
    const aiUrl = await generateShareImage({
      projectName: input.projectName,
      hook: input.hook,
    });
    if (aiUrl) return [aiUrl];
  }
  return resolveProjectMediaUrls(input.websiteUrl);
}

export async function resolveProjectMediaUrls(
  websiteUrl?: string | null,
): Promise<string[]> {
  if (!websiteUrl?.trim()) return [];

  let origin: string;
  try {
    const u = new URL(
      /^https?:\/\//i.test(websiteUrl) ? websiteUrl : `https://${websiteUrl}`,
    );
    origin = u.origin;
  } catch {
    return [];
  }

  const candidates: string[] = [];

  try {
    const res = await fetch(origin, {
      headers: { "User-Agent": "ComfyMartBot/1.0" },
      signal: AbortSignal.timeout(8000),
      redirect: "follow",
    });
    if (res.ok) {
      const html = await res.text();
      const og = extractMetaContent(html, "og:image");
      const tw = extractMetaContent(html, "twitter:image");
      if (og) candidates.push(absolutize(origin, og));
      if (tw) candidates.push(absolutize(origin, tw));
    }
  } catch {
    /* fall through to defaults */
  }

  // Sensible fallbacks for many Comfybear sites
  candidates.push(
    `${origin}/images/og-image.jpg`,
    `${origin}/images/og-image.png`,
    `${origin}/og-image.jpg`,
    `${origin}/apple-touch-icon.png`,
  );

  const unique = [...new Set(candidates.filter(Boolean))];
  for (const url of unique) {
    if (await urlLooksLikeImage(url)) return [url];
  }
  return unique.slice(0, 1);
}

function extractMetaContent(html: string, property: string): string | null {
  const escaped = property.replace(":", "\\:");
  const patterns = [
    new RegExp(
      `property=["']${escaped}["'][^>]*content=["']([^"']+)["']`,
      "i",
    ),
    new RegExp(
      `content=["']([^"']+)["'][^>]*property=["']${escaped}["']`,
      "i",
    ),
    new RegExp(`name=["']${escaped}["'][^>]*content=["']([^"']+)["']`, "i"),
    new RegExp(`content=["']([^"']+)["'][^>]*name=["']${escaped}["']`, "i"),
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m?.[1]) return m[1].trim();
  }
  return null;
}

function absolutize(origin: string, maybeRelative: string): string {
  try {
    return new URL(maybeRelative, origin).toString();
  } catch {
    return maybeRelative;
  }
}

async function urlLooksLikeImage(url: string): Promise<boolean> {
  try {
    const head = await fetch(url, {
      method: "HEAD",
      signal: AbortSignal.timeout(5000),
      redirect: "follow",
    });
    if (head.ok) {
      const ct = head.headers.get("content-type") ?? "";
      if (ct.startsWith("image/")) return true;
      if (/\.(jpe?g|png|webp|gif)(\?|$)/i.test(url)) return true;
    }
    // Some hosts block HEAD — try a tiny GET range
    const get = await fetch(url, {
      method: "GET",
      headers: { Range: "bytes=0-64" },
      signal: AbortSignal.timeout(5000),
      redirect: "follow",
    });
    const ct = get.headers.get("content-type") ?? "";
    return get.ok && (ct.startsWith("image/") || get.status === 206);
  } catch {
    return /\.(jpe?g|png|webp|gif)(\?|$)/i.test(url);
  }
}

export function mediaFromMetadata(metadata: unknown): string[] {
  if (!metadata || typeof metadata !== "object") return [];
  const raw = (metadata as { mediaUrls?: unknown }).mediaUrls;
  if (!Array.isArray(raw)) return [];
  return raw.filter((u): u is string => typeof u === "string" && /^https?:\/\//i.test(u));
}
