/** Suggest a send time from dayOffset + channel heuristics (AU-friendly defaults). */

export function suggestSendAt(input: {
  dayOffset: number;
  channel: string;
  from?: Date;
}): Date {
  const base = input.from ? new Date(input.from) : new Date();
  const at = new Date(base);
  at.setDate(at.getDate() + Math.max(0, input.dayOffset));

  // Local wall-clock suggestions (user's runtime TZ).
  switch (input.channel) {
    case "email":
      at.setHours(9, 0, 0, 0);
      break;
    case "social":
      at.setHours(11, 30, 0, 0);
      break;
    case "community":
      at.setHours(19, 0, 0, 0);
      break;
    case "content":
    case "seo":
      at.setHours(10, 0, 0, 0);
      break;
    default:
      at.setHours(12, 0, 0, 0);
  }

  // Skip Saturdays → Monday for B2B-ish channels
  if (input.channel === "seo" || input.channel === "content") {
    const day = at.getDay();
    if (day === 6) at.setDate(at.getDate() + 2);
    if (day === 0) at.setDate(at.getDate() + 1);
  }

  if (at.getTime() < Date.now() + 60_000) {
    at.setTime(Date.now() + 5 * 60_000);
  }

  return at;
}
