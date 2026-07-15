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
}): Promise<PublishResult> {
  const apiKey = process.env.AYRSHARE_API_KEY;
  const platforms = (
    input.platforms ??
    process.env.AYRSHARE_PLATFORMS?.split(",").map((p) => p.trim()) ??
    ["linkedin"]
  ).filter(Boolean);

  if (!apiKey) {
    return {
      ok: true,
      mode: "simulated",
      detail:
        "AYRSHARE_API_KEY not set — queued as published (dry-run). Add the key to go live.",
    };
  }

  try {
    const payload: Record<string, unknown> = {
      post: input.body.slice(0, 2800),
      platforms,
    };
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
    // X BYO keys (required by Ayrshare when platforms includes twitter)
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
    };

    if (!res.ok) {
      return {
        ok: false,
        mode: "live",
        error:
          json.message ||
          (typeof json.errors === "string" ? json.errors : null) ||
          `Ayrshare HTTP ${res.status}`,
      };
    }

    return {
      ok: true,
      mode: "live",
      externalId: json.id,
      detail: payload.scheduleDate
        ? `Scheduled on ${platforms.join(", ")}`
        : `Posted to ${platforms.join(", ")}`,
    };
  } catch (err) {
    return {
      ok: false,
      mode: "live",
      error: err instanceof Error ? err.message : "Social publish failed",
    };
  }
}

export async function publishInternalItem(input: {
  channel: string;
  title: string;
}): Promise<PublishResult> {
  return {
    ok: true,
    mode: "internal",
    detail: `${input.channel} “${input.title}” marked ready (no external publisher in Phase 3).`,
  };
}
