"use client";

import { useState } from "react";
import {
  SEO_PUBLISH_OVERVIEW,
  SEO_PUBLISH_PATHS,
  type SitePlatformId,
} from "@/lib/channels/seo-publish-guide";

export default function SeoPublishGuide({
  projectName,
  websiteUrl,
}: {
  projectName: string;
  websiteUrl?: string | null;
}) {
  const [platform, setPlatform] = useState<SitePlatformId>("unknown");
  const path =
    SEO_PUBLISH_PATHS.find((p) => p.id === platform) ?? SEO_PUBLISH_PATHS[0];

  return (
    <section
      id="seo-publish"
      className="mb-10 scroll-mt-8 rounded-3xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 md:p-10 card-shadow"
    >
      <h2 className="text-xl font-semibold tracking-tight">
        {SEO_PUBLISH_OVERVIEW.title}
      </h2>
      <p className="mt-2 max-w-2xl text-sm text-[var(--color-muted-foreground)]">
        {SEO_PUBLISH_OVERVIEW.summary} For{" "}
        <span className="font-medium text-[var(--color-foreground)]">
          {projectName}
        </span>
        {websiteUrl ? (
          <>
            {" "}
            → aim for a URL under{" "}
            <a
              href={websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--color-primary)] hover:underline"
            >
              {websiteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")}
            </a>
            .
          </>
        ) : (
          "."
        )}
      </p>

      <div className="mt-6">
        <h3 className="text-xs font-medium uppercase tracking-wider text-[var(--color-muted-foreground)]">
          Universal checklist
        </h3>
        <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm">
          {SEO_PUBLISH_OVERVIEW.checklist.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      </div>

      <div className="mt-8">
        <label
          htmlFor="seo-platform"
          className="text-xs font-medium uppercase tracking-wider text-[var(--color-muted-foreground)]"
        >
          What kind of website do you have?
        </label>
        <select
          id="seo-platform"
          value={platform}
          onChange={(e) => setPlatform(e.target.value as SitePlatformId)}
          className="mt-2 w-full max-w-md rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
        >
          {SEO_PUBLISH_PATHS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <p className="mt-2 text-xs text-[var(--color-muted-foreground)]">
          {path.bestFor}
        </p>
      </div>

      <div className="mt-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-4 sm:p-5">
        <h3 className="text-sm font-semibold">{path.name} — steps</h3>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm">
          {path.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        {path.tips.length > 0 && (
          <ul className="mt-4 list-disc space-y-1.5 pl-5 text-xs text-[var(--color-muted-foreground)]">
            {path.tips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        {SEO_PUBLISH_OVERVIEW.myths.map((m) => (
          <div
            key={m.myth}
            className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-muted)]/30 p-4"
          >
            <p className="text-xs font-medium text-[var(--color-muted-foreground)]">
              Myth: {m.myth}
            </p>
            <p className="mt-2 text-sm">{m.truth}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
