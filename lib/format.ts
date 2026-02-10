export type AppLocale = 'zh' | 'en';

function localeTag(locale: AppLocale): string {
  return locale === 'zh' ? 'zh-CN' : 'en-US';
}

export function formatUsd(value: number, locale: AppLocale, maximumFractionDigits = 0): string {
  const safe = Number.isFinite(value) ? value : 0;
  return `$${safe.toLocaleString(localeTag(locale), { maximumFractionDigits })}`;
}

export function formatUsdPerTai(price: number, locale: AppLocale): string {
  const safe = Number.isFinite(price) && price > 0 ? price : 0;
  return `${formatUsd(safe, locale, 6)} / TAI`;
}

export function formatTai(value: number, locale: AppLocale, maximumFractionDigits = 0): string {
  const safe = Number.isFinite(value) ? value : 0;
  return `${safe.toLocaleString(localeTag(locale), { maximumFractionDigits })} TAI`;
}

export function shortAddress(address: string | null | undefined, head = 6, tail = 4): string {
  const value = String(address || '').trim();
  if (!value) return '';
  if (value.includes('...')) return value;
  if (value.length <= head + tail + 3) return value;
  return `${value.slice(0, head)}...${value.slice(-tail)}`;
}
