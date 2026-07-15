"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    q: "Is this really set-and-forget?",
    a: "Mostly. ComfyMart drafts and schedules the work; you choose how hands-off to be. Human approval is on by default — flip autonomy per channel when you're ready.",
  },
  {
    q: "Will it post without my say-so?",
    a: "Not by default. Every publish path starts behind an approval gate. You opt into auto-post per channel, and we respect platform rate limits and anti-automation rules.",
  },
  {
    q: "Which channels are supported?",
    a: "Social (X, LinkedIn, Instagram, TikTok, YouTube, Reddit, and more), email sequences, content/SEO briefs, with SMS and video later. Unified queue, one brand voice.",
  },
  {
    q: "What's pricing?",
    a: "We're in private beta. Join the waitlist for founder pricing for life and priority onboarding. Exact plans ship with general availability.",
  },
  {
    q: "Can I resell this to clients?",
    a: "Yes — that's the agency / white-label path. Run campaigns under your brand so clients never see ComfyMart. Agency mode lands after the core campaign engine.",
  },
  {
    q: "I have multiple sites and projects — does it help?",
    a: "That's the point. Plug in each project, then use cross-project promotion to find audience overlap and lift them together without cannibalizing your brand.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section
      id="faq"
      className="border-t border-[var(--color-border)] bg-[var(--color-muted)]/40"
    >
      <div className="mx-auto max-w-3xl px-6 py-24">
        <div className="text-center">
          <p className="text-sm font-medium uppercase tracking-wider text-[var(--color-primary)]">
            FAQ
          </p>
          <h2 className="mt-3 text-balance text-4xl font-semibold tracking-tight md:text-5xl">
            Questions, answered.
          </h2>
        </div>

        <div className="mt-12 divide-y divide-[var(--color-border)] rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] card-shadow">
          {faqs.map((item, i) => {
            const isOpen = open === i;
            return (
              <div key={item.q}>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-[var(--color-muted)]/50"
                >
                  <span className="text-base font-semibold">{item.q}</span>
                  <ChevronDown
                    size={18}
                    className={`shrink-0 text-[var(--color-muted-foreground)] transition ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <p className="px-5 pb-5 text-sm leading-relaxed text-[var(--color-muted-foreground)]">
                    {item.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
