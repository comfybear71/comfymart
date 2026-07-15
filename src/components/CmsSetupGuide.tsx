"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

type CmsState = {
  cmsProvider: string;
  cmsRepo: string;
  cmsBranch: string;
  cmsGuidesPath: string;
  notifyEmail: string;
  tokenConfigured: boolean;
};

const empty: CmsState = {
  cmsProvider: "github",
  cmsRepo: "",
  cmsBranch: "master",
  cmsGuidesPath: "content/guides",
  notifyEmail: "",
  tokenConfigured: false,
};

export default function CmsSetupGuide({
  projectId,
  projectName,
  websiteUrl,
  initial,
}: {
  projectId: string;
  projectName: string;
  websiteUrl?: string | null;
  initial?: Partial<CmsState> | null;
}) {
  const [form, setForm] = useState<CmsState>({
    ...empty,
    ...initial,
    cmsProvider: initial?.cmsProvider || "github",
    cmsRepo: initial?.cmsRepo || "",
    cmsBranch: initial?.cmsBranch || "master",
    cmsGuidesPath: initial?.cmsGuidesPath || "content/guides",
    notifyEmail: initial?.notifyEmail || "",
  });
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testDetail, setTestDetail] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(`comfymart:cms-setup:${projectId}`);
      if (raw === "1") setDone(true);
    } catch {
      /* ignore */
    }
  }, [projectId]);

  function patch<K extends keyof CmsState>(key: K, value: CmsState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/cms`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cmsProvider: "github",
          cmsRepo: form.cmsRepo,
          cmsBranch: form.cmsBranch,
          cmsGuidesPath: form.cmsGuidesPath,
          notifyEmail: form.notifyEmail,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        tokenConfigured?: boolean;
      };
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      if (typeof data.tokenConfigured === "boolean") {
        patch("tokenConfigured", data.tokenConfigured);
      }
      toast.success("Site CMS settings saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  async function testConnection() {
    setTesting(true);
    setTestDetail(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/cms/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cmsRepo: form.cmsRepo,
          cmsBranch: form.cmsBranch,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        detail?: string;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        throw new Error(data.error ?? "Connection failed");
      }
      setTestDetail(data.detail ?? "Connected");
      toast.success("GitHub connection OK");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Connection failed";
      setTestDetail(msg);
      toast.error(msg);
    } finally {
      setTesting(false);
    }
  }

  function toggleDone() {
    const next = !done;
    setDone(next);
    try {
      localStorage.setItem(
        `comfymart:cms-setup:${projectId}`,
        next ? "1" : "0",
      );
    } catch {
      /* ignore */
    }
  }

  const liveHint = websiteUrl
    ? `${websiteUrl.replace(/\/$/, "")}/guides/{slug}`
    : "/guides/{slug}";

  return (
    <section
      id="site-cms"
      className="mb-10 scroll-mt-8 rounded-3xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 md:p-10 card-shadow"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Site CMS</h2>
          <p className="mt-2 max-w-2xl text-sm text-[var(--color-muted-foreground)]">
            Push approved SEO &amp; Content to{" "}
            <span className="font-medium text-[var(--color-foreground)]">
              {projectName}
            </span>
            &apos;s GitHub repo (Markdown + Next.js guide page). Download .md
            always remains as fallback.
          </p>
        </div>
        <label className="flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-muted)] px-3 py-1 text-xs font-medium text-[var(--color-muted-foreground)]">
          <input
            type="checkbox"
            checked={done}
            onChange={toggleDone}
            className="size-3.5 accent-[var(--color-primary)]"
          />
          Setup done
        </label>
      </div>

      <div className="mt-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-4 text-sm">
        <h3 className="text-xs font-medium uppercase tracking-wider text-[var(--color-muted-foreground)]">
          Checklist
        </h3>
        <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-[var(--color-muted-foreground)]">
          <li>
            Create a fine-grained GitHub PAT with Contents read/write on the
            target repo; set{" "}
            <code className="text-[0.7rem] text-[var(--color-foreground)]">
              CMS_GITHUB_TOKEN
            </code>{" "}
            in Vercel.
          </li>
          <li>Enter owner/repo, branch, and guides path below; Test connection.</li>
          <li>
            Publish SEO/Content from the studio — ComfyMart commits{" "}
            <code className="text-[0.7rem]">
              {(form.cmsGuidesPath || "content/guides") + "/{slug}.md"}
            </code>{" "}
            and{" "}
            <code className="text-[0.7rem]">src/app/guides/{"{slug}"}/page.tsx</code>.
          </li>
          <li>
            Done when the article is live at{" "}
            <code className="text-[0.7rem] text-[var(--color-foreground)]">
              {liveHint}
            </code>
            .
          </li>
        </ol>
        <p className="mt-3 text-xs text-[var(--color-muted-foreground)]">
          Server token:{" "}
          {form.tokenConfigured ? (
            <span className="text-emerald-700">configured</span>
          ) : (
            <span className="text-amber-700">missing — downloads still work</span>
          )}
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Field
          label="GitHub repo"
          placeholder="comfybear71/shademate"
          value={form.cmsRepo}
          onChange={(v) => patch("cmsRepo", v)}
        />
        <Field
          label="Branch"
          placeholder="master"
          value={form.cmsBranch}
          onChange={(v) => patch("cmsBranch", v)}
        />
        <Field
          label="Guides path"
          placeholder="content/guides"
          value={form.cmsGuidesPath}
          onChange={(v) => patch("cmsGuidesPath", v)}
        />
        <Field
          label="Notify email (sequences)"
          placeholder="you@example.com"
          value={form.notifyEmail}
          onChange={(v) => patch("notifyEmail", v)}
          type="email"
        />
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={saving}
          onClick={save}
          className="rounded-full bg-[var(--color-foreground)] px-4 py-2 text-xs font-medium text-[var(--color-background)] transition hover:opacity-90 disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save CMS settings"}
        </button>
        <button
          type="button"
          disabled={testing || !form.cmsRepo.trim()}
          onClick={testConnection}
          className="rounded-full border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-2 text-xs font-medium transition hover:bg-[var(--color-muted)] disabled:opacity-60"
        >
          {testing ? "Testing…" : "Test connection"}
        </button>
      </div>

      {testDetail && (
        <p className="mt-3 text-xs text-[var(--color-muted-foreground)]">
          {testDetail}
        </p>
      )}
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="text-xs font-medium uppercase tracking-wider text-[var(--color-muted-foreground)]">
        {label}
      </span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
      />
    </label>
  );
}
