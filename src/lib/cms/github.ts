/** GitHub Contents API helpers for Phase 4 CMS sync. */

export type GitHubRepoRef = {
  owner: string;
  repo: string;
  branch: string;
};

export type GitHubFileResult = {
  path: string;
  sha: string;
  htmlUrl?: string;
};

function token(): string | null {
  return process.env.CMS_GITHUB_TOKEN?.trim() || null;
}

export function parseRepo(repo: string): { owner: string; repo: string } | null {
  const cleaned = repo.trim().replace(/^https?:\/\/github\.com\//i, "").replace(/\.git$/, "");
  const parts = cleaned.split("/").filter(Boolean);
  if (parts.length < 2) return null;
  return { owner: parts[0], repo: parts[1] };
}

export function hasCmsGithubToken(): boolean {
  return Boolean(token());
}

async function gh<T>(
  path: string,
  init?: RequestInit,
): Promise<{ ok: boolean; status: number; data: T; error?: string }> {
  const t = token();
  if (!t) {
    return { ok: false, status: 0, data: {} as T, error: "CMS_GITHUB_TOKEN not set" };
  }

  const res = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${t}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "ComfyMart-CMS",
      ...(init?.headers ?? {}),
    },
  });

  const text = await res.text();
  let data: T = {} as T;
  try {
    data = text ? (JSON.parse(text) as T) : ({} as T);
  } catch {
    /* non-JSON */
  }

  if (!res.ok) {
    const msg =
      typeof data === "object" &&
      data &&
      "message" in data &&
      typeof (data as { message?: unknown }).message === "string"
        ? (data as { message: string }).message
        : `GitHub HTTP ${res.status}`;
    return { ok: false, status: res.status, data, error: msg };
  }

  return { ok: true, status: res.status, data };
}

export async function testGithubConnection(input: {
  repo: string;
  branch?: string | null;
}): Promise<{ ok: boolean; detail?: string; error?: string }> {
  const parsed = parseRepo(input.repo);
  if (!parsed) {
    return { ok: false, error: "Repo must look like owner/name (e.g. comfybear71/shademate)." };
  }
  if (!token()) {
    return { ok: false, error: "CMS_GITHUB_TOKEN is not configured on the server." };
  }

  const repoRes = await gh<{ full_name?: string; default_branch?: string; private?: boolean }>(
    `/repos/${parsed.owner}/${parsed.repo}`,
  );
  if (!repoRes.ok) {
    return { ok: false, error: repoRes.error ?? "Could not access repository." };
  }

  const branch = (input.branch?.trim() || repoRes.data.default_branch || "master").trim();
  const refRes = await gh<{ object?: { sha?: string } }>(
    `/repos/${parsed.owner}/${parsed.repo}/git/ref/heads/${encodeURIComponent(branch)}`,
  );
  if (!refRes.ok) {
    return {
      ok: false,
      error: `Repo OK, but branch "${branch}" not found: ${refRes.error}`,
    };
  }

  return {
    ok: true,
    detail: `Connected to ${repoRes.data.full_name} @ ${branch}${
      repoRes.data.private ? " (private)" : ""
    }`,
  };
}

export async function getFileContent(
  ref: GitHubRepoRef,
  path: string,
): Promise<{ sha: string; content: string } | null> {
  const res = await gh<{
    sha?: string;
    content?: string;
    encoding?: string;
    type?: string;
  }>(
    `/repos/${ref.owner}/${ref.repo}/contents/${encodeURI(path)}?ref=${encodeURIComponent(ref.branch)}`,
  );
  if (!res.ok || !res.data.sha || typeof res.data.content !== "string") {
    if (res.status === 404) return null;
    throw new Error(res.error ?? `Failed to read ${path}`);
  }
  const decoded = Buffer.from(res.data.content.replace(/\n/g, ""), "base64").toString("utf8");
  return { sha: res.data.sha, content: decoded };
}

export async function putFile(input: {
  ref: GitHubRepoRef;
  path: string;
  content: string;
  message: string;
  sha?: string;
}): Promise<GitHubFileResult> {
  const body: Record<string, unknown> = {
    message: input.message,
    content: Buffer.from(input.content, "utf8").toString("base64"),
    branch: input.ref.branch,
  };
  if (input.sha) body.sha = input.sha;

  const res = await gh<{
    content?: { sha?: string; path?: string; html_url?: string };
    commit?: { sha?: string };
  }>(`/repos/${input.ref.owner}/${input.ref.repo}/contents/${encodeURI(input.path)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(res.error ?? `Failed to write ${input.path}`);
  }

  return {
    path: res.data.content?.path ?? input.path,
    sha: res.data.commit?.sha ?? res.data.content?.sha ?? "",
    htmlUrl: res.data.content?.html_url,
  };
}

/** Resolve the tip SHA of a branch (e.g. master). */
export async function getBranchSha(
  owner: string,
  repo: string,
  branch: string,
): Promise<string> {
  const res = await gh<{ object?: { sha?: string } }>(
    `/repos/${owner}/${repo}/git/ref/heads/${encodeURIComponent(branch)}`,
  );
  if (!res.ok || !res.data.object?.sha) {
    throw new Error(res.error ?? `Could not resolve branch ${branch}`);
  }
  return res.data.object.sha;
}

/** Create a short-lived branch from `fromSha` (tip of base branch). */
export async function createBranch(input: {
  owner: string;
  repo: string;
  branch: string;
  fromSha: string;
}): Promise<void> {
  const res = await gh<{ ref?: string }>(`/repos/${input.owner}/${input.repo}/git/refs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ref: `refs/heads/${input.branch}`,
      sha: input.fromSha,
    }),
  });
  if (!res.ok) {
    throw new Error(res.error ?? `Failed to create branch ${input.branch}`);
  }
}

export async function createPullRequest(input: {
  owner: string;
  repo: string;
  title: string;
  body: string;
  head: string;
  base: string;
}): Promise<{ number: number; htmlUrl: string }> {
  const res = await gh<{ number?: number; html_url?: string }>(
    `/repos/${input.owner}/${input.repo}/pulls`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: input.title,
        body: input.body,
        head: input.head,
        base: input.base,
      }),
    },
  );
  if (!res.ok || !res.data.html_url) {
    throw new Error(res.error ?? "Failed to open pull request");
  }
  return {
    number: res.data.number ?? 0,
    htmlUrl: res.data.html_url,
  };
}
