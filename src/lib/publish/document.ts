/** Build SEO/Content Markdown for download (shared client + server). */

export function buildDocumentMarkdown(input: {
  channel: string;
  title: string;
  body: string;
  projectName?: string;
  websiteUrl?: string | null;
}): { markdown: string; filename: string } {
  const slug = input.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
  const filename = `${slug || input.channel}.md`;
  const markdown = [
    "---",
    `title: ${JSON.stringify(input.title)}`,
    `channel: ${input.channel}`,
    input.projectName ? `project: ${JSON.stringify(input.projectName)}` : null,
    input.websiteUrl ? `website: ${JSON.stringify(input.websiteUrl)}` : null,
    `generated_by: ComfyMart`,
    "---",
    "",
    `# ${input.title}`,
    "",
    input.body.trim(),
    "",
  ]
    .filter((line) => line !== null)
    .join("\n");

  return { markdown, filename };
}
