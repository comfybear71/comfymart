"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Sparkles, Check } from "lucide-react";

const STEPS = [
  "Reading your brand brief…",
  "Sketching social posts…",
  "Drafting email sequence…",
  "Shaping content + SEO…",
  "Queuing for human approval…",
];

export default function GenerateCampaignButton({
  projectId,
  projectName,
}: {
  projectId: string;
  projectName: string;
}) {
  const [pending, setPending] = useState(false);
  const [step, setStep] = useState(0);
  const router = useRouter();

  useEffect(() => {
    if (!pending) return;
    setStep(0);
    const id = setInterval(() => {
      setStep((s) => (s < STEPS.length - 1 ? s + 1 : s));
    }, 2200);
    return () => clearInterval(id);
  }, [pending]);

  async function generate() {
    setPending(true);
    const controller = new AbortController();
    const kill = setTimeout(() => controller.abort(), 55_000);

    try {
      const res = await fetch("/api/campaigns/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
        signal: controller.signal,
      });

      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        campaignId?: string;
        itemCount?: number;
        name?: string;
      };

      if (!res.ok) {
        toast.error(data.error ?? "Generation failed. Try again.");
        return;
      }

      if (!data.campaignId) {
        toast.error("No campaign returned. Try again.");
        return;
      }

      toast.success(
        data.itemCount
          ? `${data.itemCount} pieces ready for approval`
          : "Campaign ready",
      );
      router.push(`/dashboard/campaigns/${data.campaignId}`);
      router.refresh();
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        toast.error("Timed out — try again. We’ll fall back faster next pass.");
      } else {
        toast.error("Network error. Try again.");
      }
    } finally {
      clearTimeout(kill);
      setPending(false);
    }
  }

  if (pending) {
    return (
      <div
        className="w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 card-shadow"
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center gap-3">
          <span className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] text-white">
            <Sparkles size={18} className="animate-pulse" />
            <span className="absolute inset-0 animate-ping rounded-xl bg-[var(--color-primary)]/30" />
          </span>
          <div>
            <p className="text-sm font-semibold">Building {projectName} campaign</p>
            <p className="text-xs text-[var(--color-muted-foreground)]">
              Usually 15–40 seconds
            </p>
          </div>
        </div>

        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[var(--color-muted)]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] transition-all duration-700"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        <ul className="mt-4 space-y-2">
          {STEPS.map((label, i) => {
            const done = i < step;
            const active = i === step;
            return (
              <li
                key={label}
                className={`flex items-center gap-2 text-sm transition ${
                  active
                    ? "font-medium text-[var(--color-foreground)]"
                    : done
                      ? "text-[var(--color-muted-foreground)]"
                      : "text-[var(--color-muted-foreground)]/50"
                }`}
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                    done
                      ? "bg-emerald-100 text-emerald-700"
                      : active
                        ? "bg-[var(--color-primary)] text-white"
                        : "bg-[var(--color-muted)]"
                  }`}
                >
                  {done ? <Check size={12} /> : i + 1}
                </span>
                {label}
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={generate}
      className="rounded-full bg-[var(--color-foreground)] px-5 py-2.5 text-sm font-medium text-[var(--color-background)] transition hover:opacity-90"
    >
      Generate campaign
    </button>
  );
}
