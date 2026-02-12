const AMAZON_AFFILIATE_TAG = 'partypool-21';

export function addAmazonAffiliateTag(url: string): string {
  if (!url) return url;

  try {
    const urlObj = new URL(url);
    const isAmazon = urlObj.hostname.includes('amazon.');

    if (!isAmazon) return url;

    if (urlObj.searchParams.has('tag')) {
      urlObj.searchParams.set('tag', AMAZON_AFFILIATE_TAG);
    } else {
      urlObj.searchParams.append('tag', AMAZON_AFFILIATE_TAG);
    }

    return urlObj.toString();
  } catch {
    return url;
  }
}

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

export function createPayPalLink(emailOrUsername: string, amount: number, currency: string): string {
  if (!emailOrUsername) return '';

  const username = emailOrUsername.includes('@')
    ? emailOrUsername.split('@')[0]
    : emailOrUsername;
  const currencyCode = currency === '€' ? 'EUR' : currency === '£' ? 'GBP' : 'USD';

  return `https://www.paypal.me/${username}/${amount}${currencyCode}`;
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
