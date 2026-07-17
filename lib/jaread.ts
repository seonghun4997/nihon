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
  if (t.pos === '名詞' && prev.pos === '名詞' && prev.pos_detail_1 !== '接尾') return true; // 복합명사 (Wi-Fi, 何分)
  return false;
}

/** 일본어 문장 → 어절 단위 가나 발음 (예: '迷子になってしまいました' → 'マイゴニ ナッテシマイマシタ') */
export async function eojeolKana(jp: string): Promise<string | null> {
  try {
    const tk = await getTokenizer();
    const tokens = tk.tokenize(jp);
    if (!tokens?.length) return null;
    const units: string[] = [];
    let prev: any = null;
    for (const t of tokens) {
      const piece = /^[〇○◯～]+$/.test(t.surface_form) ? t.surface_form
        : (t.reading && t.reading !== '*' ? t.reading : t.surface_form);
      if (shouldAttach(t, prev) && units.length) units[units.length - 1] += piece;
      else units.push(piece);
      prev = t;
    }
    let out = units.join(' ').replace(/\s+([。、！？!?，．])/g, '$1');
    for (const [re, to] of NANI_FIX) out = out.replace(re, to);
    return out;
  } catch (e: any) {
    console.error("[jaread]", e?.message || e);
    return null; // 실패 시 호출부가 기존 방식으로 폴백
  }
}
