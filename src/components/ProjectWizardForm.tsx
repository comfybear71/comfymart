"use client";

import { useActionState } from "react";
import {
  createProjectAction,
  type CreateProjectState,
} from "@/app/actions/projects";

const initial: CreateProjectState = {};

export default function ProjectWizardForm() {
  const [state, formAction, pending] = useActionState(
    createProjectAction,
    initial,
  );

  return (
    <form action={formAction} className="mx-auto max-w-xl space-y-6">
      {state.error && (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {state.error}
        </p>
      )}

      <div>
        <label htmlFor="name" className="text-sm font-medium">
          Project name
        </label>
        <input
          id="name"
          name="name"
          required
          minLength={2}
          placeholder="ComfyWidget"
          disabled={pending}
          className="mt-1.5 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm outline-none transition focus:border-[var(--color-primary)] disabled:opacity-60"
        />
      </div>

      <div>
        <label htmlFor="websiteUrl" className="text-sm font-medium">
          Website URL{" "}
          <span className="font-normal text-[var(--color-muted-foreground)]">
            (optional)
          </span>
        </label>
        <input
          id="websiteUrl"
          name="websiteUrl"
          type="url"
          placeholder="https://yoursite.com"
          disabled={pending}
          className="mt-1.5 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm outline-none transition focus:border-[var(--color-primary)] disabled:opacity-60"
        />
      </div>

      <div>
        <label htmlFor="description" className="text-sm font-medium">
          What is it?
        </label>
        <textarea
          id="description"
          name="description"
          required
          minLength={10}
          rows={4}
          placeholder="One or two sentences about the product, who it's for, and what makes it different."
          disabled={pending}
          className="mt-1.5 w-full resize-y rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm outline-none transition focus:border-[var(--color-primary)] disabled:opacity-60"
        />
      </div>

      <div>
        <label htmlFor="notes" className="text-sm font-medium">
          Brand notes{" "}
          <span className="font-normal text-[var(--color-muted-foreground)]">
            (optional)
          </span>
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          placeholder="Tone, competitors to avoid, must-say phrases, launch date…"
          disabled={pending}
          className="mt-1.5 w-full resize-y rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm outline-none transition focus:border-[var(--color-primary)] disabled:opacity-60"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-[var(--color-foreground)] px-6 py-3 text-sm font-medium text-[var(--color-background)] transition hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Analyzing brief…" : "Plug project in"}
      </button>

      <p className="text-center text-xs text-[var(--color-muted-foreground)]">
        We&apos;ll generate a brand brief, then you can create campaigns and
        follow the channel setup checklist on the project page.
      </p>
    </form>
  );
}
