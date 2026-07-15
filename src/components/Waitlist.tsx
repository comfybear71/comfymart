"use client";

import { useState } from "react";
import { toast } from "sonner";

type Status = "idle" | "loading" | "success" | "error";

export default function Waitlist() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        const err = data.error ?? "Something went wrong. Try again.";
        setStatus("error");
        setMessage(err);
        toast.error(err);
        return;
      }
      setStatus("success");
      setMessage("You're in. We'll be in touch.");
      toast.success("You're on the waitlist. We'll be in touch.");
      setEmail("");
    } catch {
      const err = "Network error. Try again.";
      setStatus("error");
      setMessage(err);
      toast.error(err);
    }
  }

  return (
    <section id="waitlist" className="border-t border-[var(--color-border)]">
      <div className="mx-auto max-w-3xl px-6 py-24 text-center">
        <p className="text-sm font-medium uppercase tracking-wider text-[var(--color-primary)]">
          Waitlist
        </p>
        <h2 className="mt-3 text-balance text-4xl font-semibold tracking-tight md:text-5xl">
          Be first in line when the doors open.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg text-[var(--color-muted-foreground)]">
          Early members get founder pricing for life, priority onboarding, and
          a direct line to the team.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mx-auto mt-10 flex max-w-md flex-col gap-3 sm:flex-row"
        >
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@yourproject.com"
            className="flex-1 rounded-full border border-[var(--color-border)] bg-[var(--color-card)] px-5 py-3 text-sm outline-none transition focus:border-[var(--color-primary)]"
            disabled={status === "loading"}
            aria-describedby={message ? "waitlist-status" : undefined}
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="rounded-full bg-[var(--color-foreground)] px-6 py-3 text-sm font-medium text-[var(--color-background)] transition hover:opacity-90 disabled:opacity-60"
          >
            {status === "loading" ? "Joining…" : "Join waitlist"}
          </button>
        </form>

        {message && (
          <p
            id="waitlist-status"
            role="status"
            className={`mt-4 text-sm ${
              status === "error"
                ? "text-red-600"
                : "text-[var(--color-primary)]"
            }`}
          >
            {message}
          </p>
        )}
      </div>
    </section>
  );
}
