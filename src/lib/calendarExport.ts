import { format } from "date-fns";

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  location: string;
  startDate: Date;
  endDate: Date;
}

export const generateICalFile = (events: CalendarEvent[]): string => {
  const icalHeader = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//FixSense//Maintenance Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:FixSense Maintenance",
    "X-WR-TIMEZONE:UTC",
  ].join("\r\n");

  const icalFooter = "END:VCALENDAR";

  const icalEvents = events.map((event) => {
    const startDate = format(event.startDate, "yyyyMMdd'T'HHmmss'Z'");
    const endDate = format(event.endDate, "yyyyMMdd'T'HHmmss'Z'");
    const created = format(new Date(), "yyyyMMdd'T'HHmmss'Z'");

    return [
      "BEGIN:VEVENT",
      `UID:${event.id}@fixsense.app`,
      `DTSTAMP:${created}`,
      `DTSTART:${startDate}`,
      `DTEND:${endDate}`,
      `SUMMARY:${event.title}`,
      `DESCRIPTION:${event.description}`,
      `LOCATION:${event.location}`,
      "STATUS:CONFIRMED",
      "SEQUENCE:0",
      "END:VEVENT",
    ].join("\r\n");
  }).join("\r\n");

  return [icalHeader, icalEvents, icalFooter].join("\r\n");
};

export const downloadICalFile = (events: CalendarEvent[], filename: string = "maintenance-schedule.ics") => {
  const icalContent = generateICalFile(events);
  const blob = new Blob([icalContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const generateGoogleCalendarUrl = (event: CalendarEvent): string => {
  const startDate = format(event.startDate, "yyyyMMdd'T'HHmmss");
  const endDate = format(event.endDate, "yyyyMMdd'T'HHmmss");
  
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    details: event.description,
    location: event.location,
    dates: `${startDate}/${endDate}`,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};
