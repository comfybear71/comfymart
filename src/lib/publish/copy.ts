/** Strip internal draft scaffolding before posting to social networks. */

export function cleanSocialCopy(body: string): string {
  const drop =
    /^(built for|tone|audience|usp|keywords|ready for approval|human gate|human approval)\b/i;

  const lines = body
    .split(/\r?\n/)
    .map((l) => l.trimEnd())
    .filter((line) => {
      const t = line.trim();
      if (!t) return true;
      if (drop.test(t)) return false;
      if /^\(.*approval.*\)$/i.test(t)) return false;
      if /^ready for approval/i.test(t)) return false;
      return true;
    });

  // Collapse excessive blank lines
  return lines
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
