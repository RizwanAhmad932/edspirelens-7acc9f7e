export interface IcsDay {
  day: number;
  focus: string;
  minutes: number;
  tasks: string[];
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

/** Local date-time in the floating (no timezone) iCalendar format. */
function toIcsLocal(d: Date) {
  return (
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}` +
    `T${pad(d.getHours())}${pad(d.getMinutes())}00`
  );
}

function toIcsUtc(d: Date) {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function escapeIcs(text: string) {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/** Fold long lines to 75 octets per RFC 5545 so every calendar app parses it. */
function fold(line: string) {
  if (line.length <= 74) return line;
  const parts: string[] = [];
  let rest = line;
  parts.push(rest.slice(0, 74));
  rest = rest.slice(74);
  while (rest.length) {
    parts.push(" " + rest.slice(0, 73));
    rest = rest.slice(73);
  }
  return parts.join("\r\n");
}

export function buildRevisionIcs(opts: {
  title: string;
  days: IcsDay[];
  startDate?: Date;
  startHour?: number;
  reminderMinutes?: number;
}) {
  const { title, days, startHour = 18, reminderMinutes = 30 } = opts;
  const base = opts.startDate ? new Date(opts.startDate) : new Date();
  base.setHours(startHour, 0, 0, 0);
  const stamp = toIcsUtc(new Date());

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Edspire Lens//Adaptive Revision Plan//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeIcs(title)}`,
  ];

  days.forEach((d, i) => {
    const start = new Date(base);
    start.setDate(base.getDate() + i);
    const end = new Date(start.getTime() + Math.max(15, d.minutes || 45) * 60000);
    const description = d.tasks.map((t, n) => `${n + 1}. ${t}`).join("\n");
    lines.push(
      "BEGIN:VEVENT",
      `UID:edspire-revision-${stamp}-${d.day}-${i}@edspirelens`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${toIcsLocal(start)}`,
      `DTEND:${toIcsLocal(end)}`,
      fold(`SUMMARY:${escapeIcs(`Day ${d.day}: ${d.focus}`)}`),
      fold(`DESCRIPTION:${escapeIcs(description)}`),
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      fold(`DESCRIPTION:${escapeIcs(`Revision time — ${d.focus}`)}`),
      `TRIGGER:-PT${Math.max(0, reminderMinutes)}M`,
      "END:VALARM",
      "END:VEVENT",
    );
  });

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

export function downloadIcs(filename: string, ics: string) {
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".ics") ? filename : `${filename}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
