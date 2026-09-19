import type { EventItem } from '../types/event';

// Format date into standard ICS format YYYYMMDDTHHmmssZ
function formatICSDate(dateStr: string, timeStr: string): string {
  if (!dateStr) return '';
  const cleanDate = dateStr.replace(/-/g, '');
  if (timeStr === 'TBA' || !timeStr) {
    return cleanDate;
  }
  // Convert IST (UTC+5:30) to UTC for standard ICS compatibility
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, mins] = timeStr.split(':').map(Number);
  const localDate = new Date(year, month - 1, day, hours, mins);
  
  // Subtract 5.5 hours for UTC
  const utcDate = new Date(localDate.getTime() - 5.5 * 60 * 60 * 1000);
  
  const utcY = utcDate.getUTCFullYear();
  const utcM = String(utcDate.getUTCMonth() + 1).padStart(2, '0');
  const utcD = String(utcDate.getUTCDate()).padStart(2, '0');
  const utcH = String(utcDate.getUTCHours()).padStart(2, '0');
  const utcMin = String(utcDate.getUTCMinutes()).padStart(2, '0');
  
  return `${utcY}${utcM}${utcD}T${utcH}${utcMin}00Z`;
}

// Generate .ics calendar download
export function downloadICSFile(event: EventItem) {
  const startStr = formatICSDate(event.startDate, event.startTime);
  const endStr = formatICSDate(event.endDate, event.endTime);

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Mumbai Onchain Week 2026//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${event.id}-2026@mumbai-onchain-week`,
    `DTSTAMP:${formatICSDate(new Date().toISOString().split('T')[0], '00:00')}`,
    `DTSTART:${startStr}`,
    `DTEND:${endStr}`,
    `SUMMARY:${event.title}`,
    `DESCRIPTION:${(event.description || '').replace(/\n/g, '\\n')} - Link: ${event.officialUrl}`,
    `LOCATION:${event.location}${event.address ? `, ${event.address}` : ''}`,
    `URL:${event.officialUrl}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${event.slug}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Generate Google Calendar Link
export function getGoogleCalendarUrl(event: EventItem): string {
  const startStr = formatICSDate(event.startDate, event.startTime);
  const endStr = formatICSDate(event.endDate, event.endTime);
  const details = encodeURIComponent(`${event.description || ''}\n\nOfficial Link: ${event.officialUrl}`);
  const location = encodeURIComponent(`${event.location}, ${event.address || 'Mumbai'}`);
  const title = encodeURIComponent(event.title);

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startStr}/${endStr}&details=${details}&location=${location}&ctz=Asia/Kolkata`;
}

// Generate Outlook Web Calendar Link
export function getOutlookCalendarUrl(event: EventItem): string {
  const startStr = `${event.startDate}T${event.startTime === 'TBA' ? '09:00:00' : event.startTime + ':00'}`;
  const endStr = `${event.endDate}T${event.endTime === 'TBA' ? '18:00:00' : event.endTime + ':00'}`;
  const title = encodeURIComponent(event.title);
  const body = encodeURIComponent(`${event.description || ''}\nOfficial Link: ${event.officialUrl}`);
  const location = encodeURIComponent(`${event.location}, ${event.address || 'Mumbai'}`);

  return `https://outlook.live.com/calendar/0/deeplink/compose?subject=${title}&body=${body}&location=${location}&startdt=${startStr}&enddt=${endStr}`;
}
