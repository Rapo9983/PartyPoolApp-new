export function extractImageFromUrl(url: string): string | null {
  if (!url) return null;

  try {
    const urlObj = new URL(url);

    if (urlObj.hostname.includes('amazon.')) {
      const asinMatch = url.match(/\/dp\/([A-Z0-9]{10})|\/gp\/product\/([A-Z0-9]{10})/);
      if (asinMatch) {
        const asin = asinMatch[1] || asinMatch[2];
        return `https://images-na.ssl-images-amazon.com/images/P/${asin}.jpg`;
      }
    }

    return null;
  } catch {
    return null;
  }
}

export function createPayPalLink(emailOrUsername: string, amount: number, currency: string, itemName?: string): string {
  if (!emailOrUsername) return '';

  const currencyCode = currency === '€' ? 'EUR' : currency === '£' ? 'GBP' : 'USD';

  if (emailOrUsername.includes('@')) {
    const encodedItemName = encodeURIComponent(itemName || 'Regalo PartyPool');
    return `https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=${encodeURIComponent(emailOrUsername)}&amount=${amount}&currency_code=${currencyCode}&item_name=${encodedItemName}`;
  } else {
    return `https://paypal.me/${emailOrUsername}/${amount}${currencyCode}`;
  }
}

export function formatCurrency(amount: number, currencySymbol: string = '€'): string {
  const currencyCode = currencySymbol === '€' ? 'EUR' : currencySymbol === '£' ? 'GBP' : 'USD';

  const locale = currencyCode === 'EUR' ? 'it-IT' : currencyCode === 'GBP' ? 'en-GB' : 'en-US';

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  } catch {
    return `${currencySymbol}${amount.toFixed(2)}`;
  }
}
