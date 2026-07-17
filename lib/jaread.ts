// 일본어 원문 → 형태소 분석 → 한국어식 어절 분절 발음 (서버 전용)
// 내용어(명사·동사·형용사·부사…)에서 새 어절 시작, 조사·조동사·비자립·접미는 앞 어절에 붙임
import path from 'path';

let tokenizerPromise: Promise<any> | null = null;

function getTokenizer(): Promise<any> {
  if (!tokenizerPromise) {
    tokenizerPromise = new Promise((resolve, reject) => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const kuromoji = require('kuromoji');
      // require.resolve는 웹팩이 숫자 모듈ID로 치환하므로 사용 금지 — cwd 기준 고정 경로
      const dicPath = path.join(process.cwd(), 'node_modules', 'kuromoji', 'dict');
      kuromoji.builder({ dicPath }).build((err: any, tk: any) => (err ? reject(err) : resolve(tk)));
    });
  }
  return tokenizerPromise;
}

// 조수사 앞의 何(ナニ) 교정: なんぷん・なんじ 등
const NANI_FIX: [RegExp, string][] = [
  [/ナニプン|ナニブン/g, 'ナンプン'], [/ナニジ/g, 'ナンジ'], [/ナニニン/g, 'ナンニン'],
  [/ナニカイ/g, 'ナンカイ'], [/ナニコ(?![ウオ])/g, 'ナンコ'], [/ナニエン/g, 'ナンエン'],
  [/ナニメイ/g, 'ナンメイ'], [/ナニホン/g, 'ナンボン'], [/ナニマイ/g, 'ナンマイ'],
  [/ナニサイ/g, 'ナンサイ'], [/ナニヨウビ/g, 'ナンヨウビ'], [/ナニバン/g, 'ナンバン'],
];

function shouldAttach(t: any, prev: any | null): boolean {
  if (!prev) return false;
  if (t.pos === '助詞' || t.pos === '助動詞') return true;
  if (t.pos === '記号') return true; // 문장부호는 앞 어절에
  if (t.pos_detail_1 === '接尾') return true;
  if (t.pos === '動詞' && t.pos_detail_1 === '非自立') return true;
  if (t.pos === '動詞' && t.basic_form === 'する' && prev.pos === '名詞') return true; // お願い+します
  if (t.pos === '名詞' && prev.pos === '名詞' && prev.pos_detail_1 !== '接尾') return true; // 복합명사 (Wi-Fi, 何分)
  return false;
}

/** 일본어 문장 → 어절 단위 [원문, 발음] 쌍 — 두 줄이 같은 경계로 매칭됨 */
export async function eojeolPair(jp: string): Promise<{ jp: string; kana: string } | null> {
  try {
    const tk = await getTokenizer();
    const tokens = tk.tokenize(jp);
    if (!tokens?.length) return null;
    const surf: string[] = [];
    const read: string[] = [];
    let prev: any = null;
    let pfxS = '', pfxR = ''; // 접두사(お·ご 등)는 다음 어절 앞에 붙임
    for (const t of tokens) {
      const piece = /^[〇○◯～]+$/.test(t.surface_form) ? t.surface_form
        : (t.reading && t.reading !== '*' ? t.reading : t.surface_form);
      if (t.pos === '接頭詞') { pfxS += t.surface_form; pfxR += piece; prev = t; continue; }
      if (shouldAttach(t, prev) && surf.length && !pfxS) {
        surf[surf.length - 1] += t.surface_form;
        read[read.length - 1] += piece;
      } else {
        surf.push(pfxS + t.surface_form);
        read.push(pfxR + piece);
        pfxS = ''; pfxR = '';
      }
      prev = t;
    }
    if (pfxS) { surf.push(pfxS); read.push(pfxR); }
    const clean = (a: string[]) => a.join(' ').replace(/\s+([。、！？!?，．])/g, '$1');
    let kana = clean(read);
    for (const [re, to] of NANI_FIX) kana = kana.replace(re, to);
    return { jp: clean(surf), kana };
  } catch (e: any) {
    console.error('[jaread]', e?.message || e);
    return null; // 실패 시 호출부가 기존 방식으로 폴백
  }
}

/** (호환) 발음만 필요할 때 */
export async function eojeolKana(jp: string): Promise<string | null> {
  const p = await eojeolPair(jp);
  return p ? p.kana : null;
}
