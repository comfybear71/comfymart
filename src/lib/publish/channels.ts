export type PublishResult = {
  ok: boolean;
  mode: "live" | "simulated" | "internal";
  externalId?: string;
  detail?: string;
  error?: string;
};

function parseEmailBody(body: string): { subject: string; html: string } {
  const lines = body.split(/\r?\n/);
  let subject = "ComfyMart campaign";
  let start = 0;
  if (lines[0]?.toLowerCase().startsWith("subject:")) {
    subject = lines[0].slice(8).trim() || subject;
    start = 1;
    if (lines[1]?.trim() === "") start = 2;
  }
  const text = lines.slice(start).join("\n").trim();
  const html = text
    .split(/\n{2,}/)
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br/>")}</p>`)
    .join("\n");
  return { subject, html };
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function publishEmailItem(input: {
  title: string;
  body: string;
  toEmail: string;
}): Promise<PublishResult> {
  const apiKey = process.env.RESEND_API_KEY ?? process.env.AUTH_RESEND_KEY;
  const from =
    process.env.EMAIL_FROM ?? "ComfyMart <noreply@comfymart.xyz>";

  if (!apiKey) {
    return {
      ok: true,
      mode: "simulated",
      detail: "RESEND_API_KEY not set — marked published without sending.",
    };
  }

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);
    const { subject, html } = parseEmailBody(input.body);
    const result = await resend.emails.send({
      from,
      to: input.toEmail,
      subject: subject || input.title,
      html: `${html}<hr/><p style="color:#6b6478;font-size:12px">Sent via ComfyMart · human-approved</p>`,
    });

    if (result.error) {
      return { ok: false, mode: "live", error: result.error.message };
    }

    return {
      ok: true,
      mode: "live",
      externalId: result.data?.id,
      detail: `Email sent to ${input.toEmail}`,
    };
  } catch (err) {
    return {
      ok: false,
      mode: "live",
      error: err instanceof Error ? err.message : "Email send failed",
    };
  }
}

export async function publishSocialItem(input: {
  body: string;
  platforms?: string[];
  scheduleDate?: Date;
  mediaUrls?: string[];
}): Promise<PublishResult> {
  const apiKey = process.env.AYRSHARE_API_KEY?.trim();
  let platforms = (
    input.platforms ??
    process.env.AYRSHARE_PLATFORMS?.split(",").map((p) => p.trim()) ??
    ["linkedin"]
  )
    .map((p) => p.toLowerCase())
    .filter(Boolean);

  // Instagram (and similar) require media — drop them for text-only posts
  // so LinkedIn/Facebook still succeed.
  const mediaUrls = (input.mediaUrls ?? []).filter(Boolean);
  if (mediaUrls.length === 0) {
    const needsMedia = new Set(["instagram", "tiktok", "pinterest"]);
    platforms = platforms.filter((p) => !needsMedia.has(p));
  }

  if (platforms.length === 0) {
    return {
      ok: false,
      mode: "live",
      error:
        "No publishable platforms left (Instagram needs an image). Set AYRSHARE_PLATFORMS=linkedin,facebook for text posts.",
    };
  }

  if (!apiKey) {
    return {
      ok: true,
      mode: "simulated",
      detail:
        "AYRSHARE_API_KEY not set — dry-run only. Add the key and restart the server for live posts.",
    };
  }

  try {
    const payload: Record<string, unknown> = {
      post: input.body.slice(0, 2800),
      platforms,
    };
    if (mediaUrls.length) payload.mediaUrls = mediaUrls;
    if (input.scheduleDate && input.scheduleDate.getTime() > Date.now() + 60_000) {
      payload.scheduleDate = input.scheduleDate.toISOString();
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    };
    if (process.env.AYRSHARE_PROFILE_KEY) {
      headers["Profile-Key"] = process.env.AYRSHARE_PROFILE_KEY;
    }
    const twitterKey =
      process.env.AYRSHARE_TWITTER_API_KEY ??
      process.env.X_CONSUMER_KEY ??
      process.env.X_API_KEY;
    const twitterSecret =
      process.env.AYRSHARE_TWITTER_API_SECRET ??
      process.env.X_CONSUMER_SECRET ??
      process.env.X_API_SECRET;
    if (twitterKey && twitterSecret) {
      headers["X-Twitter-OAuth1-Api-Key"] = twitterKey;
      headers["X-Twitter-OAuth1-Api-Secret"] = twitterSecret;
    }

    const res = await fetch("https://api.ayrshare.com/api/post", {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
    const json = (await res.json().catch(() => ({}))) as {
      id?: string;
      status?: string;
      message?: string;
      errors?: unknown;
      posts?: unknown;
    };

    if (!res.ok || json.status === "error") {
      const errMsg =
        json.message ||
        (typeof json.errors === "string"
          ? json.errors
          : json.errors
            ? JSON.stringify(json.errors)
            : null) ||
        `Ayrshare HTTP ${res.status}`;
      return { ok: false, mode: "live", error: errMsg };
    }

    return {
      ok: true,
      mode: "live",
      externalId: json.id,
      detail: payload.scheduleDate
        ? `Scheduled on ${platforms.join(", ")}`
        : `Posted to ${platforms.join(", ")} via Ayrshare`,
    };
  } catch (err) {
    return {
      ok: false,
      mode: "live",
      error: err instanceof Error ? err.message : "Social publish failed",
    };
  }
}

import { buildDocumentMarkdown } from "@/lib/publish/document";
import {
  projectHasCmsConfig,
  pushDocumentToGithub,
  type CmsProjectConfig,
} from "@/lib/cms/publish";

export type DocumentPublishResult = PublishResult & {
  markdown?: string;
  filename?: string;
  commitSha?: string;
  liveUrl?: string;
  markdownPath?: string;
  pagePath?: string;
};

/** SEO / Content: Markdown download + optional GitHub CMS push. */
export async function publishDocumentItem(input: {
  channel: string;
  title: string;
  body: string;
  projectName?: string;
  websiteUrl?: string | null;
  cms?: CmsProjectConfig | null;
}): Promise<DocumentPublishResult> {
  const { markdown, filename } = buildDocumentMarkdown(input);
  const cmsConfig: CmsProjectConfig = {
    ...(input.cms ?? {}),
    projectName: input.projectName ?? input.cms?.projectName,
    websiteUrl: input.websiteUrl ?? input.cms?.websiteUrl,
  };

  if (projectHasCmsConfig(cmsConfig)) {
    const cms = await pushDocumentToGithub({
      channel: input.channel,
      title: input.title,
      body: input.body,
      project: cmsConfig,
    });

    if (cms.pushed) {
      return {
        ok: true,
        mode: "live",
        externalId: cms.commitSha,
        detail: cms.detail,
        markdown,
        filename,
        commitSha: cms.commitSha,
        liveUrl: cms.liveUrl,
        markdownPath: cms.markdownPath,
        pagePath: cms.pagePath,
      };
    }

    return {
      ok: true,
      mode: "internal",
      detail: cms.error
        ? `${cms.detail} (${cms.error})`
        : `${cms.detail} Packaged as ${filename}.`,
      markdown,
      filename,
      error: cms.error,
    };
  }

  return {
    ok: true,
    mode: "internal",
    detail: `${input.channel} packaged as ${filename} — download and publish to your site CMS.`,
    markdown,
    filename,
  };
}
