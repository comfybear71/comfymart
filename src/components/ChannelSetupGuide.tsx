"use client";

import { useEffect, useMemo, useState } from "react";
import type { BrandBrief } from "@/lib/ai/brief";
import {
  briefSetupHints,
  personalizeGuide,
  recommendPlatforms,
  requiredSteps,
  SETUP_FACTS,
  suggestedPlatformsEnv,
  type SetupPriority,
} from "@/lib/channels/ayrshare-setup";

const priorityLabel: Record<SetupPriority, string> = {
  must: "Must",
  recommended: "Recommended",
  optional: "Optional",
  later: "Later",
};

type Progress = {
  platforms: Record<string, boolean>;
  steps: Record<string, boolean>;
};

export default function ChannelSetupGuide({
  projectId,
  projectName,
  websiteUrl,
  brief,
}: {
  projectId: string;
  projectName: string;
  websiteUrl?: string | null;
  brief: BrandBrief | null;
}) {
  const storageKey = `comfymart:ayrshare-setup:v3:${projectId}`;
  const hints = useMemo(
    () => briefSetupHints(brief, projectName, websiteUrl),
    [brief, projectName, websiteUrl],
  );
  const platforms = useMemo(() => {
    return recommendPlatforms(brief).map((p) =>
      personalizeGuide(p, hints, projectName, websiteUrl),
    );
  }, [brief, hints, projectName, websiteUrl]);
  const envHint = useMemo(() => suggestedPlatformsEnv(brief), [brief]);
  const [progress, setProgress] = useState<Progress>({
    platforms: {},
    steps: {},
  });
  const [openId, setOpenId] = useState<string | null>("gmb");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Progress;
      if (parsed && typeof parsed === "object" && "steps" in parsed) {
        setProgress(parsed);
      }
    } catch {
      /* ignore */
    }
  }, [storageKey]);

  function save(next: Progress) {
    setProgress(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }

  function togglePlatform(id: string) {
    save({
      ...progress,
      platforms: { ...progress.platforms, [id]: !progress.platforms[id] },
    });
  }

  function toggleStep(
    platformId: string,
    stepId: string,
    requiredIds: string[],
  ) {
    const key = `${platformId}:${stepId}`;
    const steps = { ...progress.steps, [key]: !progress.steps[key] };
    const allRequiredDone =
      requiredIds.length > 0 &&
      requiredIds.every((id) =>
        id === stepId ? steps[key] : steps[`${platformId}:${id}`],
      );
    save({
      steps,
      platforms: {
        ...progress.platforms,
        [platformId]: allRequiredDone,
      },
    });
  }

  const mustCount = platforms.filter((p) => p.priority === "must").length;
  const mustDone = platforms.filter(
    (p) => p.priority === "must" && progress.platforms[p.id],
  ).length;

  return (
    <section className="mb-10 rounded-3xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 md:p-10 card-shadow">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            Social channel setup
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-[var(--color-muted-foreground)]">
            Ayrshare-first checklist for{" "}
            <span className="font-medium text-[var(--color-foreground)]">
              {projectName}
            </span>
            . Tick required steps only. Optional Meta/ads items never block
            go-live.
          </p>
        </div>
        <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-muted)] px-3 py-1 text-xs font-medium text-[var(--color-muted-foreground)]">
          Must-have {mustDone}/{mustCount}
        </span>
      </div>

      <div className="mt-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-4 text-sm">
        <h3 className="text-xs font-medium uppercase tracking-wider text-[var(--color-muted-foreground)]">
          Facts (read once)
        </h3>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-[var(--color-muted-foreground)]">
          {SETUP_FACTS.map((fact) => (
            <li key={fact}>{fact}</li>
          ))}
        </ul>
        {websiteUrl && (
          <p className="mt-3 text-xs text-[var(--color-muted-foreground)]">
            Product URL:{" "}
            <a
              href={websiteUrl}
              className="text-[var(--color-primary)] hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {websiteUrl}
            </a>
          </p>
        )}
        <p className="mt-2 text-xs text-[var(--color-muted-foreground)]">
          Suggested env:{" "}
          <code className="break-all text-[0.7rem] text-[var(--color-foreground)]">
            AYRSHARE_PLATFORMS={envHint || "linkedin,facebook,instagram"}
          </code>
        </p>
      </div>

      <ul className="mt-6 space-y-2">
        {platforms.map((p) => {
          const isOpen = openId === p.id;
          const checked = Boolean(progress.platforms[p.id]);
          const req = requiredSteps(p);
          const stepDone = req.filter(
            (st) => progress.steps[`${p.id}:${st.id}`],
          ).length;
          const optional = p.steps.filter((st) => st.required === false);
          return (
            <li
              key={p.id}
              className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)]"
            >
              <div className="flex items-stretch gap-2 p-3 sm:p-4">
                <label className="flex shrink-0 items-center pt-0.5">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => togglePlatform(p.id)}
                    className="size-4 accent-[var(--color-primary)]"
                    aria-label={`Mark ${p.name} setup done`}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => setOpenId(isOpen ? null : p.id)}
                  className="min-w-0 flex-1 text-left"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`font-medium ${checked ? "text-[var(--color-muted-foreground)] line-through" : ""}`}
                    >
                      {p.name}
                    </span>
                    <span className="rounded-md border border-[var(--color-border)] px-2 py-0.5 text-[0.65rem] font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
                      {priorityLabel[p.priority]}
                    </span>
                    <span className="text-[0.65rem] text-[var(--color-muted-foreground)]">
                      {stepDone}/{req.length} required
                    </span>
                    {p.needsMedia && (
                      <span className="text-[0.65rem] text-[var(--color-muted-foreground)]">
                        Needs media
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
                    {p.reason}
                  </p>
                </button>
              </div>

              {isOpen && (
                <div className="border-t border-[var(--color-border)] px-4 py-4 text-sm sm:px-5">
                  <p className="rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-muted)]/30 px-3 py-2 text-xs text-[var(--color-muted-foreground)]">
                    <span className="font-medium text-[var(--color-foreground)]">
                      Done when:
                    </span>{" "}
                    {p.doneWhen}
                  </p>

                  {(p.id === "gmb" ||
                    p.id === "facebook" ||
                    p.id === "instagram") && (
                    <div className="mt-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-3 text-xs">
                      <p className="font-medium text-[var(--color-foreground)]">
                        From your brand brief
                      </p>
                      {p.id === "gmb" && (
                        <>
                          <p className="mt-2 rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-muted)]/40 px-2 py-2 text-[var(--color-muted-foreground)]">
                            <span className="font-medium text-[var(--color-foreground)]">
                              Plain English:
                            </span>{" "}
                            Google will try to sell you Ads credit and Workspace
                            email. Click{" "}
                            <span className="font-medium text-[var(--color-foreground)]">
                              Skip
                            </span>{" "}
                            until you hit verification or your profile home.
                            Those offers are optional paid products — not
                            ComfyMart setup.
                          </p>
                          <p className="mt-2 text-[var(--color-muted-foreground)]">
                            Try these Google categories (closest match wins):
                          </p>
                          <ul className="mt-1 list-disc pl-4 text-[var(--color-foreground)]">
                            {hints.categories.map((c) => (
                              <li key={c}>
                                {c}
                                {c === hints.primaryCategory
                                  ? " (start here)"
                                  : ""}
                              </li>
                            ))}
                          </ul>
                          <p className="mt-3 text-[var(--color-muted-foreground)]">
                            Business description (paste into Google — max 750
                            chars):
                          </p>
                          <p className="mt-1 whitespace-pre-wrap rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] p-2 text-[var(--color-foreground)]">
                            {hints.businessDescription}
                          </p>
                          <button
                            type="button"
                            className="mt-2 text-[var(--color-primary)] hover:underline"
                            onClick={async () => {
                              try {
                                await navigator.clipboard.writeText(
                                  hints.businessDescription,
                                );
                                setCopied(true);
                                setTimeout(() => setCopied(false), 2000);
                              } catch {
                                /* ignore */
                              }
                            }}
                          >
                            {copied ? "Copied" : "Copy description"}
                          </button>
                        </>
                      )}
                      {(p.id === "facebook" || p.id === "instagram") && (
                        <p className="mt-2 text-[var(--color-muted-foreground)]">
                          Suggested bio:{" "}
                          <span className="text-[var(--color-foreground)]">
                            {hints.pageBio}
                          </span>
                        </p>
                      )}
                    </div>
                  )}

                  <p className="mt-3 text-[var(--color-muted-foreground)]">
                    <span className="font-medium text-[var(--color-foreground)]">
                      Account:
                    </span>{" "}
                    {p.accountType}
                  </p>

                  <h3 className="mt-4 text-xs font-medium uppercase tracking-wider text-[var(--color-muted-foreground)]">
                    Required for ComfyMart
                  </h3>
                  <ul className="mt-3 space-y-3">
                    {req.map((st, i) => {
                      const stepKey = `${p.id}:${st.id}`;
                      const stepChecked = Boolean(progress.steps[stepKey]);
                      return (
                        <li
                          key={st.id}
                          className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-3"
                        >
                          <label className="flex gap-3">
                            <input
                              type="checkbox"
                              checked={stepChecked}
                              onChange={() =>
                                toggleStep(
                                  p.id,
                                  st.id,
                                  req.map((x) => x.id),
                                )
                              }
                              className="mt-1 size-4 shrink-0 accent-[var(--color-primary)]"
                            />
                            <span className="min-w-0">
                              <span
                                className={`font-medium ${stepChecked ? "text-[var(--color-muted-foreground)] line-through" : ""}`}
                              >
                                {i + 1}. {st.title}
                              </span>
                              <ol className="mt-2 list-decimal space-y-1.5 pl-4 text-xs text-[var(--color-muted-foreground)]">
                                {st.how.map((line) => (
                                  <li key={line}>{line}</li>
                                ))}
                              </ol>
                            </span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>

                  {optional.length > 0 && (
                    <>
                      <h3 className="mt-5 text-xs font-medium uppercase tracking-wider text-[var(--color-muted-foreground)]">
                        Optional / later (skip during onboarding)
                      </h3>
                      <ul className="mt-3 space-y-3">
                        {optional.map((st) => (
                          <li
                            key={st.id}
                            className="rounded-xl border border-dashed border-[var(--color-border)] p-3 opacity-90"
                          >
                            <p className="text-sm font-medium text-[var(--color-muted-foreground)]">
                              {st.title}
                            </p>
                            <ol className="mt-2 list-decimal space-y-1.5 pl-4 text-xs text-[var(--color-muted-foreground)]">
                              {st.how.map((line) => (
                                <li key={line}>{line}</li>
                              ))}
                            </ol>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}

                  {p.doNot.length > 0 && (
                    <>
                      <h3 className="mt-5 text-xs font-medium uppercase tracking-wider text-red-700/80">
                        Do not
                      </h3>
                      <ul className="mt-2 list-disc space-y-1.5 pl-5 text-xs text-[var(--color-muted-foreground)]">
                        {p.doNot.map((d) => (
                          <li key={d}>{d}</li>
                        ))}
                      </ul>
                    </>
                  )}

                  <h3 className="mt-5 text-xs font-medium uppercase tracking-wider text-[var(--color-muted-foreground)]">
                    Ayrshare
                  </h3>
                  <ul className="mt-2 list-disc space-y-1.5 pl-5 text-xs text-[var(--color-muted-foreground)]">
                    {p.ayrshareTips.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                    <li>
                      Platform id:{" "}
                      <code className="text-[0.7rem] text-[var(--color-foreground)]">
                        {p.id}
                      </code>
                    </li>
                  </ul>

                  {p.commonFails.length > 0 && (
                    <>
                      <h3 className="mt-5 text-xs font-medium uppercase tracking-wider text-[var(--color-muted-foreground)]">
                        If it fails
                      </h3>
                      <ul className="mt-2 list-disc space-y-1.5 pl-5 text-xs text-[var(--color-muted-foreground)]">
                        {p.commonFails.map((f) => (
                          <li key={f}>{f}</li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
