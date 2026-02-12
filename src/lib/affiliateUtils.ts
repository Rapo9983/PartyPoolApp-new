const AMAZON_AFFILIATE_TAG = 'partypoolapp-21';

export function isAmazonLink(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    return hostname.includes('amazon.') || hostname.includes('amzn.');
  } catch {
    return false;
  }
}

export function addAmazonAffiliateTag(url: string): string {
  if (!isAmazonLink(url)) {
    return url;
  }

  try {
    const urlObj = new URL(url);

    urlObj.searchParams.delete('tag');
    urlObj.searchParams.delete('linkCode');
    urlObj.searchParams.delete('linkId');

    urlObj.searchParams.set('tag', AMAZON_AFFILIATE_TAG);

    return urlObj.toString();
  } catch {
    return url;
  }
}

export function getAffiliateDisclaimer(): string {
  return "In qualità di Affiliato Amazon, PartyPool riceve un guadagno dagli acquisti idonei.";
}

export function generateCalendarEvent(
  title: string,
  date: string,
  description: string,
  url?: string
): string {
  const eventDate = new Date(date);
  const dateStr = eventDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//PartyPool//Event//IT',
    'BEGIN:VEVENT',
    `UID:${Date.now()}@partypool.app`,
    `DTSTAMP:${dateStr}`,
    `DTSTART:${dateStr}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description}${url ? '\\n\\n' + url : ''}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR'
  ];

  return lines.join('\r\n');
}

export function downloadCalendarFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

export function createGoogleCalendarUrl(
  title: string,
  date: string,
  description: string,
  url?: string
): string {
  const eventDate = new Date(date);
  const dateStr = eventDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${dateStr}/${dateStr}`,
    details: description + (url ? '\n\n' + url : ''),
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

export function scheduleReminder(
  title: string,
  body: string,
  date: Date
): void {
  if (Notification.permission !== 'granted') {
    return;
  }

  const now = new Date();
  const delay = date.getTime() - now.getTime();

  if (delay > 0) {
    setTimeout(() => {
      new Notification(title, {
        body,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
      });
    }, delay);
  }
}
