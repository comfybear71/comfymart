import { buildDocumentMarkdown } from "@/lib/publish/document";
import {
  createBranch,
  createPullRequest,
  getBranchSha,
  getFileContent,
  hasCmsGithubToken,
  parseRepo,
  putFile,
  type GitHubRepoRef,
} from "@/lib/cms/github";
import {
  buildGuidePageTsx,
  patchGuidesIndex,
  patchSitemapXml,
} from "@/lib/cms/guide-page-template";

export type CmsProjectConfig = {
  cmsProvider?: string | null;
  cmsRepo?: string | null;
  cmsBranch?: string | null;
  cmsGuidesPath?: string | null;
  websiteUrl?: string | null;
  projectName?: string | null;
};

export type CmsPublishResult = {
  pushed: boolean;
  commitSha?: string;
  prUrl?: string;
  liveUrl?: string;
  markdownPath?: string;
  pagePath?: string;
  detail: string;
  error?: string;
};

function slugFromTitle(title: string, channel: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60) || channel
  );
}

function normalizeGuidesPath(raw?: string | null): string {
  const p = (raw?.trim() || "content/guides").replace(/^\/+|\/+$/g, "");
  return p || "content/guides";
}

function workBranchName(slug: string): string {
  const short = Date.now().toString(36);
  return `comfymart/guide-${slug}-${short}`.slice(0, 100);
}

export function projectHasCmsConfig(project: CmsProjectConfig): boolean {
  return (
    (project.cmsProvider === "github" || !project.cmsProvider) &&
    Boolean(project.cmsRepo?.trim()) &&
    hasCmsGithubToken()
  );
}

export async function pushDocumentToGithub(input: {
  channel: string;
  title: string;
  body: string;
  project: CmsProjectConfig;
}): Promise<CmsPublishResult> {
  const repoRaw = input.project.cmsRepo?.trim();
  if (!repoRaw) {
    return { pushed: false, detail: "No CMS repo configured." };
  }
  if (!hasCmsGithubToken()) {
    return {
      pushed: false,
      detail: "CMS_GITHUB_TOKEN not set — Markdown download only.",
    };
  }

  const parsed = parseRepo(repoRaw);
  if (!parsed) {
    return { pushed: false, detail: "Invalid cmsRepo.", error: "Invalid cmsRepo" };
  }

  const baseBranch = input.project.cmsBranch?.trim() || "master";
  const slug = slugFromTitle(input.title, input.channel);
  const guidesPath = normalizeGuidesPath(input.project.cmsGuidesPath);
  const mdPath = `${guidesPath}/${slug}.md`;
  const pagePath = `src/app/guides/${slug}/page.tsx`;
  const { markdown } = buildDocumentMarkdown({
    channel: input.channel,
    title: input.title,
    body: input.body,
    projectName: input.project.projectName ?? undefined,
    websiteUrl: input.project.websiteUrl,
  });

  const base = (input.project.websiteUrl ?? "").replace(/\/$/, "");
  const liveUrl = base ? `${base}/guides/${slug}` : undefined;

  try {
    // Read existing files from the protected base branch, then commit onto a PR branch.
    const baseRef: GitHubRepoRef = {
      owner: parsed.owner,
      repo: parsed.repo,
      branch: baseBranch,
    };
    const tipSha = await getBranchSha(parsed.owner, parsed.repo, baseBranch);
    const headBranch = workBranchName(slug);
    await createBranch({
      owner: parsed.owner,
      repo: parsed.repo,
      branch: headBranch,
      fromSha: tipSha,
    });

    const ref: GitHubRepoRef = {
      owner: parsed.owner,
      repo: parsed.repo,
      branch: headBranch,
    };

    const existingMd = await getFileContent(baseRef, mdPath);
    const mdResult = await putFile({
      ref,
      path: mdPath,
      content: markdown,
      message: `content(guides): ${input.title} via ComfyMart`,
      sha: existingMd?.sha,
    });

    const pageTsx = buildGuidePageTsx({
      title: input.title,
      slug,
      markdownRelativeImport: mdPath,
    });
    const existingPage = await getFileContent(baseRef, pagePath);
    await putFile({
      ref,
      path: pagePath,
      content: pageTsx,
      message: `feat(guides): add /guides/${slug} page via ComfyMart`,
      sha: existingPage?.sha,
    });

    // Best-effort index + sitemap patches (read from base, write to head)
    for (const indexPath of [
      "src/app/guides/page.tsx",
      "src/app/guides/index.tsx",
      "content/guides/index.md",
    ]) {
      try {
        const idx = await getFileContent(baseRef, indexPath);
        if (!idx) continue;
        const patched = patchGuidesIndex(idx.content, {
          slug,
          title: input.title,
        });
        if (patched) {
          await putFile({
            ref,
            path: indexPath,
            content: patched,
            message: `chore(guides): link ${slug} in index via ComfyMart`,
            sha: idx.sha,
          });
        }
        break;
      } catch {
        /* ignore optional index */
      }
    }

    if (input.project.websiteUrl) {
      for (const sitemapPath of ["public/sitemap.xml", "sitemap.xml"]) {
        try {
          const sm = await getFileContent(baseRef, sitemapPath);
          if (!sm) continue;
          const patched = patchSitemapXml(sm.content, {
            websiteUrl: input.project.websiteUrl,
            slug,
          });
          if (patched) {
            await putFile({
              ref,
              path: sitemapPath,
              content: patched,
              message: `chore(seo): add /guides/${slug} to sitemap via ComfyMart`,
              sha: sm.sha,
            });
          }
          break;
        } catch {
          /* ignore optional sitemap */
        }
      }
    }

    const pr = await createPullRequest({
      owner: parsed.owner,
      repo: parsed.repo,
      head: headBranch,
      base: baseBranch,
      title: `ComfyMart guide: ${input.title}`,
      body: [
        `Guide published by **ComfyMart**.`,
        ``,
        `- **Slug:** \`${slug}\``,
        `- **Markdown:** \`${mdPath}\``,
        `- **Page:** \`${pagePath}\``,
        liveUrl ? `- **Live URL (after merge):** ${liveUrl}` : null,
        ``,
        `Merge this PR to deploy the guide.`,
      ]
        .filter(Boolean)
        .join("\n"),
    });

    const shaShort = mdResult.sha.slice(0, 7);
    const detail = liveUrl
      ? `Opened PR — merge to go live at ${liveUrl}. ${pr.htmlUrl}`
      : `Opened PR (${shaShort}) — merge to publish. ${pr.htmlUrl}`;

    return {
      pushed: true,
      commitSha: mdResult.sha,
      prUrl: pr.htmlUrl,
      liveUrl,
      markdownPath: mdPath,
      pagePath,
      detail,
    };
  } catch (err) {
    console.error("[cms/publish]", err);
    return {
      pushed: false,
      detail: "GitHub push failed — Markdown download still available.",
      error: err instanceof Error ? err.message : "GitHub push failed",
    };
  }
}
