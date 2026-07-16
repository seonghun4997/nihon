import { cookies } from 'next/headers';
import type { Lang } from './claude';

export const LANGS: { key: Lang; label: string; flag: string; name: string }[] = [
  { key: 'jp', label: '일본어', flag: '🇯🇵', name: '일본어' },
  { key: 'en', label: '영어', flag: '🇬🇧', name: '영어' },
];

export function getLang(): Lang {
  const v = cookies().get('lang')?.value;
  return v === 'en' ? 'en' : 'jp';
}

export function langName(l: Lang) { return l === 'en' ? '영어' : '일본어'; }
