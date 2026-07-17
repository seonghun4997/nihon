// 표현 객체에 어절 분절 발음을 주입 (서버 전용) — 형태소 우선, 실패 시 기존 방식 폴백
import { eojeolPair } from './jaread';
import { kanaToHangul, segmentKana } from './kana2ko';

type Item = { jp?: string; word?: string; reading?: string; kana?: string; [k: string]: any };

export async function koreanize<T extends Item>(item: T, lang: string): Promise<T> {
  if (lang !== 'jp') return item;
  const src = item.jp || item.word || '';
  // 1순위: 형태소 분석으로 [원문, 발음]을 같은 어절 경계로 (소급·완전 분절·줄맞춤 매칭)
  if (src && /[\u3040-\u30ff\u4e00-\u9faf]/.test(src)) {
    const pair = await eojeolPair(src);
    if (pair) {
      const out: T = { ...item, kana: pair.kana, reading: kanaToHangul(pair.kana) };
      if (item.jp) out.jp = pair.jp; // 원문도 같은 단위로 띄어 표시 (채점은 공백 무시라 안전)
      return out;
    }
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
