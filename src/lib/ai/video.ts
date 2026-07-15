import { put } from "@vercel/blob";
import { generateShareImage } from "@/lib/ai/imagine";

const XAI_VIDEOS_URL = "https://api.x.ai/v1/videos/generations";
const DEFAULT_VIDEO_MODEL = "grok-imagine-video";

type StartResponse = {
  request_id?: string;
  id?: string;
};

type PollResponse = {
  status?: string;
  video?: { url?: string };
  url?: string;
  error?: string | { message?: string };
};

export type GenerateVideoInput = {
  projectName: string;
  /** Content script / body used as motion + scene context. */
  script: string;
  title?: string;
  /** Optional still; if omitted, generate via Grok Imagine first. */
  imageUrl?: string | null;
  hook?: string | null;
  durationSeconds?: number;
};

export type GenerateVideoResult = {
  ok: boolean;
  videoUrl?: string;
  imageUrl?: string;
  requestId?: string;
  detail?: string;
  error?: string;
};

/**
 * Content script → still (optional) → xAI image-to-video → Vercel Blob URL.
 */
export async function generateContentVideo(
  input: GenerateVideoInput,
): Promise<GenerateVideoResult> {
  const apiKey = process.env.XAI_API_KEY?.trim();
  if (!apiKey) {
    return { ok: false, error: "XAI_API_KEY not set." };
  }

  let imageUrl = input.imageUrl?.trim() || null;
  if (!imageUrl) {
    imageUrl = await generateShareImage({
      projectName: input.projectName,
      hook: input.hook ?? input.title ?? null,
      scene:
        "Product hero still suitable as the first frame of a short marketing video, stable composition, clear subject.",
    });
  }

  if (!imageUrl) {
    return {
      ok: false,
      error: "Could not create a starting still for video generation.",
    };
  }

  const model =
    process.env.XAI_VIDEO_MODEL?.trim() || DEFAULT_VIDEO_MODEL;
  const duration = Math.min(
    15,
    Math.max(
      5,
      input.durationSeconds ?? (Number(process.env.XAI_VIDEO_DURATION) || 8),
    ),
  );
  const prompt = buildMotionPrompt(input);

  try {
    const startRes = await fetch(XAI_VIDEOS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        prompt,
        image: { url: imageUrl },
        duration,
      }),
    });

    if (!startRes.ok) {
      const detail = await startRes.text().catch(() => "");
      console.error("[video] start error", startRes.status, detail.slice(0, 400));
      return {
        ok: false,
        imageUrl,
        error: `xAI video start failed (${startRes.status})`,
      };
    }

    const startJson = (await startRes.json()) as StartResponse;
    const requestId = startJson.request_id ?? startJson.id;
    if (!requestId) {
      return { ok: false, imageUrl, error: "No request_id from xAI video API." };
    }

    const tempUrl = await pollVideo(apiKey, requestId);
    if (!tempUrl) {
      return {
        ok: false,
        imageUrl,
        requestId,
        error: "Video generation timed out or failed.",
      };
    }

    const durable = await persistVideoToBlob(tempUrl, input.projectName);
    return {
      ok: true,
      videoUrl: durable ?? tempUrl,
      imageUrl,
      requestId,
      detail: durable
        ? "Video ready on Vercel Blob."
        : "Video ready (temporary xAI URL — set BLOB_READ_WRITE_TOKEN for durable links).",
    };
  } catch (err) {
    console.error("[video] failed", err);
    return {
      ok: false,
      imageUrl: imageUrl ?? undefined,
      error: err instanceof Error ? err.message : "Video generation failed",
    };
  }
}

function buildMotionPrompt(input: GenerateVideoInput): string {
  const script = input.script.trim().slice(0, 600);
  return [
    `Short cinematic product marketing clip for "${input.projectName}".`,
    input.title ? `Topic: ${input.title}.` : null,
    `Animate the starting frame with subtle camera motion and natural product presence.`,
    `Motion direction inspired by this script (do not render text overlays): ${script}`,
    `No on-screen text, logos, or watermarks. Keep the product recognizable.`,
  ]
    .filter(Boolean)
    .join(" ");
}

async function pollVideo(
  apiKey: string,
  requestId: string,
  maxAttempts = 36,
  intervalMs = 5000,
): Promise<string | null> {
  for (let i = 0; i < maxAttempts; i++) {
    const res = await fetch(`https://api.x.ai/v1/videos/${requestId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("[video] poll error", res.status, detail.slice(0, 300));
      if (res.status === 404 || res.status >= 500) {
        await sleep(intervalMs);
        continue;
      }
      return null;
    }

    const json = (await res.json()) as PollResponse;
    const status = (json.status ?? "").toLowerCase();
    if (status === "done" || status === "completed" || status === "succeeded") {
      return json.video?.url ?? json.url ?? null;
    }
    if (status === "failed" || status === "expired" || status === "error") {
      console.error("[video] job failed", json.error ?? status);
      return null;
    }
    await sleep(intervalMs);
  }
  return null;
}

async function persistVideoToBlob(
  videoUrl: string,
  projectName: string,
): Promise<string | null> {
  if (!process.env.BLOB_READ_WRITE_TOKEN?.trim()) return null;

  try {
    const res = await fetch(videoUrl);
    if (!res.ok) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    const contentType = res.headers.get("content-type") ?? "video/mp4";
    const slug = projectName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40);
    const path = `comfymart/video/${slug}-${Date.now()}.mp4`;
    const blob = await put(path, buffer, {
      access: "public",
      contentType,
      addRandomSuffix: true,
    });
    return blob.url;
  } catch (err) {
    console.error("[video] blob upload failed", err);
    return null;
  }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
