import { useUserProfile } from './useUserProfile';

export interface CurrencyOption {
  code: string;
  label: string;
  locale: string;
}

export const CURRENCIES: CurrencyOption[] = [
  { code: 'PHP', label: 'Philippine Peso (₱)',    locale: 'en-PH' },
  { code: 'USD', label: 'US Dollar ($)',           locale: 'en-US' },
  { code: 'EUR', label: 'Euro (€)',                locale: 'en-EU' },
  { code: 'GBP', label: 'British Pound (£)',       locale: 'en-GB' },
  { code: 'AUD', label: 'Australian Dollar (A$)',  locale: 'en-AU' },
  { code: 'CAD', label: 'Canadian Dollar (C$)',    locale: 'en-CA' },
  { code: 'SGD', label: 'Singapore Dollar (S$)',   locale: 'en-SG' },
  { code: 'MYR', label: 'Malaysian Ringgit (RM)',  locale: 'ms-MY' },
  { code: 'IDR', label: 'Indonesian Rupiah (Rp)',  locale: 'id-ID' },
  { code: 'THB', label: 'Thai Baht (฿)',           locale: 'th-TH' },
  { code: 'JPY', label: 'Japanese Yen (¥)',        locale: 'ja-JP' },
  { code: 'KRW', label: 'South Korean Won (₩)',    locale: 'ko-KR' },
  { code: 'INR', label: 'Indian Rupee (₹)',        locale: 'en-IN' },
  { code: 'AED', label: 'UAE Dirham (د.إ)',        locale: 'ar-AE' },
  { code: 'NZD', label: 'New Zealand Dollar (NZ$)', locale: 'en-NZ' },
  { code: 'CNY', label: 'Chinese Yuan (¥)',        locale: 'zh-CN' },
];

export const LOCATIONS = [
  'Philippines',
  'United States',
  'United Kingdom',
  'Australia',
  'Canada',
  'Singapore',
  'Malaysia',
  'Indonesia',
  'Thailand',
  'South Korea',
  'Japan',
  'India',
  'United Arab Emirates',
  'New Zealand',
  'China',
  'Other',
];

export function useCurrency() {
  const { profile } = useUserProfile();
  const code = profile.currency ?? 'PHP';
  const entry = CURRENCIES.find(c => c.code === code) ?? CURRENCIES[0];

  function fmt(n: number): string {
    return new Intl.NumberFormat(entry.locale, {
      style: 'currency',
      currency: entry.code,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(n);
  }

  function fmtOu(n: number): { text: string; cls: string } {
    if (n === 0) return { text: fmt(0), cls: 'text-ink-muted' };
    if (n < 0)   return { text: `(${fmt(-n)})`, cls: 'text-danger' };
    return { text: fmt(n), cls: 'text-positive' };
  }

  return { fmt, fmtOu, currency: entry };
}
