import { put } from "@vercel/blob";

const XAI_IMAGES_URL = "https://api.x.ai/v1/images/generations";

/** Grok Imagine — same API shape as aiglitch / other Comfybear projects. */
const DEFAULT_MODEL = "grok-imagine-image";

type ImagineResponse = {
  data?: Array<{ url?: string; b64_json?: string }>;
};

export type GenerateShareImageInput = {
  projectName: string;
  /** Short USP / positioning from the brand brief. */
  hook?: string | null;
  /** Extra scene direction. */
  scene?: string | null;
};

/**
 * Generate a square social image via xAI Grok Imagine.
 * Prefers Vercel Blob when `BLOB_READ_WRITE_TOKEN` is set (URLs don't expire).
 * Falls back to the temporary xAI CDN URL when Blob isn't configured.
 */
export async function generateShareImage(
  input: GenerateShareImageInput,
): Promise<string | null> {
  const apiKey = process.env.XAI_API_KEY?.trim();
  if (!apiKey) return null;

  const prompt = buildPrompt(input);

  try {
    const res = await fetch(XAI_IMAGES_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.XAI_IMAGE_MODEL?.trim() || DEFAULT_MODEL,
        prompt,
        n: 1,
        response_format: "url",
        aspect_ratio: "1:1",
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("[imagine] xAI error", res.status, detail.slice(0, 300));
      return null;
    }

    const json = (await res.json()) as ImagineResponse;
    const tempUrl = json.data?.[0]?.url;
    if (!tempUrl) {
      console.error("[imagine] no image URL in response");
      return null;
    }

    const durable = await persistToBlob(tempUrl, input.projectName);
    return durable ?? tempUrl;
  } catch (err) {
    console.error("[imagine] failed", err);
    return null;
  }
}

function buildPrompt(input: GenerateShareImageInput): string {
  const hook = input.hook?.trim();
  const parts = [
    `Photorealistic commercial product photo for Instagram (1:1).`,
    `Brand/product name: "${input.projectName}".`,
    hook
      ? `The product is exactly this — show THIS physical product, not a metaphor: ${hook}`
      : `Show the real physical product associated with "${input.projectName}".`,
    input.scene
      ? `Scene: ${input.scene}.`
      : `Scene: product installed or displayed in a realistic Australian residential outdoor setting, natural daylight.`,
    `If the product is an outdoor aircon / HVAC cover or shade for a condenser unit: show a reflective top cover fitted on a split-system outdoor air conditioner unit (metal cabinet with fan/vents visible and unobstructed).`,
    `Do NOT invent fashion items, sun hats, beach bags, sunglasses, or unrelated lifestyle flat-lays unless the product is clothing or fashion.`,
    `No text, no logos, no watermarks, no brand wordmarks in the image.`,
  ];
  return parts.filter(Boolean).join(" ");
}

async function persistToBlob(
  imageUrl: string,
  projectName: string,
): Promise<string | null> {
  if (!process.env.BLOB_READ_WRITE_TOKEN?.trim()) return null;

  try {
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) return null;
    const buffer = Buffer.from(await imgRes.arrayBuffer());
    const contentType =
      imgRes.headers.get("content-type") ?? "image/png";
    const slug = projectName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40);
    const path = `comfymart/share/${slug}-${Date.now()}.png`;
    const blob = await put(path, buffer, {
      access: "public",
      contentType,
      addRandomSuffix: true,
    });
    return blob.url;
  } catch (err) {
    console.error("[imagine] blob upload failed", err);
    return null;
  }
}
