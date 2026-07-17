// 표현 객체에 어절 분절 발음을 주입 (서버 전용) — 형태소 우선, 실패 시 기존 방식 폴백
import { eojeolKana } from './jaread';
import { kanaToHangul, segmentKana } from './kana2ko';

type Item = { jp?: string; word?: string; reading?: string; kana?: string; [k: string]: any };

export async function koreanize<T extends Item>(item: T, lang: string): Promise<T> {
  if (lang !== 'jp') return item;
  const src = item.jp || item.word || '';
  // 1순위: 일본어 원문에서 형태소 분석으로 어절 발음 계산 (소급·완전 분절)
  if (src && /[\u3040-\u30ff\u4e00-\u9faf]/.test(src)) {
    const kana = await eojeolKana(src);
    if (kana) return { ...item, kana, reading: kanaToHangul(kana) };
  }
  // 2순위: AI가 준 가나 reading을 안전 분절 후 변환
  const raw = item.kana && /[\u3040-\u30ff]/.test(String(item.kana)) ? String(item.kana)
    : item.reading && /[\u3040-\u30ff]/.test(String(item.reading)) ? String(item.reading) : null;
  if (raw) { const s = segmentKana(raw); return { ...item, kana: s, reading: kanaToHangul(s) }; }
  return item;
}

export async function koreanizeAll<T extends Item>(items: T[], lang: string): Promise<T[]> {
  return Promise.all((items || []).map((i) => koreanize(i, lang)));
}
