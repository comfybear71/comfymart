"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";

export type StudioItem = {
  id: string;
  channel: string;
  title: string;
  body: string;
  dayOffset: number;
  status: string;
  scheduledFor?: string | Date | null;
  publishedAt?: string | Date | null;
  publishError?: string | null;
};

const statusLabel: Record<string, string> = {
  pending_approval: "Needs approval",
  approved: "Approved",
  rejected: "Rejected",
  draft: "Draft",
  scheduled: "Scheduled",
  published: "Published",
  failed: "Failed",
};

const channelLabel: Record<string, string> = {
  social: "Social",
  email: "Email",
  content: "Content",
  seo: "SEO",
  community: "Community",
};

async function reviewItems(
  itemIds: string[],
  decision: "approved" | "rejected",
) {
  const res = await fetch("/api/campaigns/items/review", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ itemIds, decision }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    error?: string;
    updated?: number;
  };
  if (!res.ok) throw new Error(data.error ?? "Update failed");
  return data;
}

async function publishItems(itemIds: string[], mode: "now" | "schedule") {
  const res = await fetch("/api/campaigns/items/publish", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ itemIds, mode }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    error?: string;
    published?: number;
    scheduled?: number;
    failed?: number;
    results?: Array<{ id: string; status: string; detail?: string; error?: string }>;
  };
  if (!res.ok) throw new Error(data.error ?? "Publish failed");
  return data;
}

export default function CampaignStudio({
  initialItems,
}: {
  initialItems: StudioItem[];
}) {
  const [items, setItems] = useState(initialItems);
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);

  const pendingIds = useMemo(
    () => items.filter((i) => i.status === "pending_approval").map((i) => i.id),
    [items],
  );
  const approvedIds = useMemo(
    () =>
      items
        .filter((i) => i.status === "approved" || i.status === "failed")
        .map((i) => i.id),
    [items],
  );

  const pending = pendingIds.length;
  const approved = items.filter((i) => i.status === "approved").length;
  const published = items.filter((i) => i.status === "published").length;
  const scheduled = items.filter((i) => i.status === "scheduled").length;

  function patchItems(
    ids: string[],
    patch: Partial<StudioItem> | ((item: StudioItem) => Partial<StudioItem>),
  ) {
    setItems((prev) =>
      prev.map((item) => {
        if (!ids.includes(item.id)) return item;
        const extra = typeof patch === "function" ? patch(item) : patch;
        return { ...item, ...extra };
      }),
    );
  }

  async function decide(ids: string[], decision: "approved" | "rejected") {
    if (ids.length === 0) return;
    const previous = items;
    patchItems(ids, { status: decision });
    setBusyIds((s) => new Set([...s, ...ids]));
    try {
      await reviewItems(ids, decision);
      toast.success(
        ids.length > 1
          ? `${ids.length} ${decision}`
          : decision === "approved"
            ? "Approved"
            : "Rejected",
      );
    } catch (err) {
      setItems(previous);
      toast.error(err instanceof Error ? err.message : "Could not update");
    } finally {
      setBusyIds((s) => {
        const next = new Set(s);
        ids.forEach((id) => next.delete(id));
        return next;
      });
    }
  }

  async function publish(ids: string[], mode: "now" | "schedule") {
    if (ids.length === 0) return;
    const previous = items;
    setBusyIds((s) => new Set([...s, ...ids]));
    try {
      const data = await publishItems(ids, mode);
      const byId = new Map((data.results ?? []).map((r) => [r.id, r]));
      setItems((prev) =>
        prev.map((item) => {
          const r = byId.get(item.id);
          if (!r) return item;
          return {
            ...item,
            status: r.status,
            publishError: r.error ?? null,
          };
        }),
      );

      if (data.failed) {
        toast.error(`${data.failed} failed — check item errors`);
      } else if (mode === "schedule") {
        toast.success(`${data.scheduled ?? ids.length} scheduled`);
      } else {
        toast.success(`${data.published ?? ids.length} published`);
      }
    } catch (err) {
      setItems(previous);
      toast.error(err instanceof Error ? err.message : "Publish failed");
    } finally {
      setBusyIds((s) => {
        const next = new Set(s);
        ids.forEach((id) => next.delete(id));
        return next;
      });
    }
  }

  async function approveAll() {
    if (pendingIds.length === 0 || bulkBusy) return;
    setBulkBusy(true);
    await decide(pendingIds, "approved");
    setBulkBusy(false);
  }

  async function publishAll(mode: "now" | "schedule") {
    if (approvedIds.length === 0 || bulkBusy) return;
    setBulkBusy(true);
    await publish(approvedIds, mode);
    setBulkBusy(false);
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <p className="text-sm text-[var(--color-muted-foreground)]">
          {pending} awaiting · {approved} approved · {scheduled} scheduled ·{" "}
          {published} published
        </p>
        <div className="flex flex-wrap gap-2">
          {pending > 0 && (
            <button
              type="button"
              disabled={bulkBusy}
              onClick={approveAll}
              className="rounded-full border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-2 text-xs font-medium transition hover:bg-[var(--color-muted)] disabled:opacity-60"
            >
              {bulkBusy ? "Working…" : `Approve all (${pending})`}
            </button>
          )}
          {approvedIds.length > 0 && (
            <>
              <button
                type="button"
                disabled={bulkBusy}
                onClick={() => publishAll("schedule")}
                className="rounded-full border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-2 text-xs font-medium transition hover:bg-[var(--color-muted)] disabled:opacity-60"
              >
                Schedule approved
              </button>
              <button
                type="button"
                disabled={bulkBusy}
                onClick={() => publishAll("now")}
                className="rounded-full bg-[var(--color-foreground)] px-4 py-2 text-xs font-medium text-[var(--color-background)] transition hover:opacity-90 disabled:opacity-60"
              >
                Publish approved
              </button>
            </>
          )}
        </div>
      </div>

      <p className="mb-6 rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-muted)]/40 px-4 py-3 text-xs text-[var(--color-muted-foreground)]">
        Email sends to your signed-in address via Resend. Social uses Ayrshare when{" "}
        <code className="text-[0.7rem]">AYRSHARE_API_KEY</code> is set; otherwise
        dry-run publish. Content/SEO are marked ready internally.
      </p>

      {items.length === 0 ? (
        <p className="text-[var(--color-muted-foreground)]">
          No content items yet.
        </p>
      ) : (
        <ul className="space-y-4">
          {items.map((item) => {
            const busy = busyIds.has(item.id);
            return (
              <li
                key={item.id}
                className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 card-shadow"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-lg bg-[var(--color-muted)] px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
                        {channelLabel[item.channel] ?? item.channel}
                      </span>
                      <span className="text-xs text-[var(--color-muted-foreground)]">
                        Day {item.dayOffset}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          item.status === "published"
                            ? "bg-emerald-50 text-emerald-700"
                            : item.status === "scheduled"
                              ? "bg-sky-50 text-sky-700"
                              : item.status === "approved"
                                ? "bg-emerald-50/70 text-emerald-800"
                                : item.status === "failed"
                                  ? "bg-red-50 text-red-700"
                                  : item.status === "rejected"
                                    ? "bg-red-50 text-red-700"
                                    : "bg-[var(--color-accent-soft)] text-[var(--color-foreground)]"
                        }`}
                      >
                        {statusLabel[item.status] ?? item.status}
                      </span>
                    </div>
                    <h2 className="mt-2 text-lg font-semibold">{item.title}</h2>
                    {item.publishError && (
                      <p className="mt-1 text-xs text-red-600">
                        {item.publishError}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {item.status === "pending_approval" && (
                      <>
                        <button
                          type="button"
                          disabled={busy || bulkBusy}
                          onClick={() => decide([item.id], "approved")}
                          className="rounded-full bg-[var(--color-foreground)] px-4 py-1.5 text-xs font-medium text-[var(--color-background)] transition hover:opacity-90 disabled:opacity-60"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          disabled={busy || bulkBusy}
                          onClick={() => decide([item.id], "rejected")}
                          className="rounded-full border border-[var(--color-border)] px-4 py-1.5 text-xs font-medium text-[var(--color-muted-foreground)] transition hover:bg-[var(--color-muted)] disabled:opacity-60"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {(item.status === "approved" || item.status === "failed") && (
                      <>
                        <button
                          type="button"
                          disabled={busy || bulkBusy}
                          onClick={() => publish([item.id], "schedule")}
                          className="rounded-full border border-[var(--color-border)] px-4 py-1.5 text-xs font-medium transition hover:bg-[var(--color-muted)] disabled:opacity-60"
                        >
                          Schedule
                        </button>
                        <button
                          type="button"
                          disabled={busy || bulkBusy}
                          onClick={() => publish([item.id], "now")}
                          className="rounded-full bg-[var(--color-foreground)] px-4 py-1.5 text-xs font-medium text-[var(--color-background)] transition hover:opacity-90 disabled:opacity-60"
                        >
                          Publish
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <pre className="mt-4 whitespace-pre-wrap font-sans text-sm leading-relaxed text-[var(--color-muted-foreground)]">
                  {item.body}
                </pre>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
