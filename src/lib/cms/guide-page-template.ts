/** Next.js App Router guide page committed alongside Markdown content. */

export function buildGuidePageTsx(input: {
  title: string;
  slug: string;
  markdownRelativeImport: string;
}): string {
  const titleLit = JSON.stringify(input.title);
  const slugLit = JSON.stringify(input.slug);

  return `import type { Metadata } from "next";
import { readFile } from "node:fs/promises";
import path from "node:path";

export const metadata: Metadata = {
  title: ${titleLit},
};

function stripFrontmatter(raw: string): string {
  if (!raw.startsWith("---")) return raw;
  const end = raw.indexOf("\\n---", 3);
  if (end === -1) return raw;
  return raw.slice(end + 4).replace(/^\\s+/, "");
}

function mdToHtml(md: string): string {
  const escaped = md
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return escaped
    .split(/\\n{2,}/)
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return "";
      if (trimmed.startsWith("# ")) {
        return \`<h1>\${trimmed.slice(2)}</h1>\`;
      }
      if (trimmed.startsWith("## ")) {
        return \`<h2>\${trimmed.slice(3)}</h2>\`;
      }
      if (trimmed.startsWith("### ")) {
        return \`<h3>\${trimmed.slice(4)}</h3>\`;
      }
      if (trimmed.startsWith("- ")) {
        const items = trimmed
          .split("\\n")
          .filter((l) => l.startsWith("- "))
          .map((l) => \`<li>\${l.slice(2)}</li>\`)
          .join("");
        return \`<ul>\${items}</ul>\`;
      }
      return \`<p>\${trimmed.replace(/\\n/g, "<br/>")}</p>\`;
    })
    .filter(Boolean)
    .join("\\n");
}

export default async function GuidePage() {
  const filePath = path.join(process.cwd(), ${JSON.stringify(input.markdownRelativeImport)});
  const raw = await readFile(filePath, "utf8");
  const body = stripFrontmatter(raw);
  const html = mdToHtml(body);

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <article
        className="prose prose-neutral max-w-none"
        dangerouslySetInnerHTML={{ __html: html }}
      />
      <p className="mt-12 text-sm text-neutral-500">
        Guide: {${slugLit}} · published via ComfyMart
      </p>
    </main>
  );
}
`;
}

/** Patch a guides index page to include a new slug link when a marker exists. */
export function patchGuidesIndex(
  existing: string,
  input: { slug: string; title: string },
): string | null {
  const href = `/guides/${input.slug}`;
  if (existing.includes(href)) return null;

  const entry = `  { href: ${JSON.stringify(href)}, title: ${JSON.stringify(input.title)} },\n`;

  // Prefer inserting into a COMFYMART_GUIDES array marker.
  const marker = "/* COMFYMART_GUIDES */";
  if (existing.includes(marker)) {
    return existing.replace(marker, `${marker}\n${entry.trimEnd()}`);
  }

  // Fallback: append a comment block the site can adopt later.
  const block = `\n// ComfyMart guide: [${input.title}](${href})\n`;
  if (existing.includes(block.trim())) return null;
  return existing + block;
}

/** Best-effort sitemap.xml patch for /guides/{slug}. */
export function patchSitemapXml(
  existing: string,
  input: { websiteUrl: string; slug: string },
): string | null {
  const base = input.websiteUrl.replace(/\/$/, "");
  const loc = `${base}/guides/${input.slug}`;
  if (existing.includes(loc)) return null;

  const entry = `  <url>\n    <loc>${loc}</loc>\n    <changefreq>monthly</changefreq>\n  </url>\n`;
  if (existing.includes("</urlset>")) {
    return existing.replace("</urlset>", `${entry}</urlset>`);
  }
  return null;
}
