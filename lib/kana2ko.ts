// 가나 → 한글 발음 변환기 (AI가 히라가나를 내놔도 저장 직전에 기계적으로 한글화)
// 규칙: 요음(きゃ→캬)·촉음(っ→앞 글자에 ㅅ받침)·발음(ん→앞 글자에 ㄴ받침)·장음(ー→앞 모음 반복 생략)

const DIGRAPH: Record<string, string> = {
  'きゃ': '캬', 'きゅ': '큐', 'きょ': '쿄', 'ぎゃ': '갸', 'ぎゅ': '규', 'ぎょ': '교',
  'しゃ': '샤', 'しゅ': '슈', 'しょ': '쇼', 'じゃ': '자', 'じゅ': '주', 'じょ': '조',
  'ちゃ': '차', 'ちゅ': '추', 'ちょ': '초', 'にゃ': '냐', 'にゅ': '뉴', 'にょ': '뇨',
  'ひゃ': '햐', 'ひゅ': '휴', 'ひょ': '효', 'びゃ': '뱌', 'びゅ': '뷰', 'びょ': '뵤',
  'ぴゃ': '퍄', 'ぴゅ': '퓨', 'ぴょ': '표', 'みゃ': '먀', 'みゅ': '뮤', 'みょ': '묘',
  'りゃ': '랴', 'りゅ': '류', 'りょ': '료',
  'ふぁ': '화', 'ふぃ': '휘', 'ふぇ': '훼', 'ふぉ': '훠',
  'うぃ': '위', 'うぇ': '웨', 'うぉ': '워', 'つぁ': '차', 'てぃ': '티', 'でぃ': '디',
  'ヴぁ': '바', 'ヴぃ': '비', 'ヴぇ': '베', 'ヴぉ': '보',
};

const MONO: Record<string, string> = {
  'あ': '아', 'い': '이', 'う': '우', 'え': '에', 'お': '오',
  'か': '카', 'き': '키', 'く': '쿠', 'け': '케', 'こ': '코',
  'が': '가', 'ぎ': '기', 'ぐ': '구', 'げ': '게', 'ご': '고',
  'さ': '사', 'し': '시', 'す': '스', 'せ': '세', 'そ': '소',
  'ざ': '자', 'じ': '지', 'ず': '즈', 'ぜ': '제', 'ぞ': '조',
  'た': '타', 'ち': '치', 'つ': '츠', 'て': '테', 'と': '토',
  'だ': '다', 'ぢ': '지', 'づ': '즈', 'で': '데', 'ど': '도',
  'な': '나', 'に': '니', 'ぬ': '누', 'ね': '네', 'の': '노',
  'は': '하', 'ひ': '히', 'ふ': '후', 'へ': '헤', 'ほ': '호',
  'ば': '바', 'び': '비', 'ぶ': '부', 'べ': '베', 'ぼ': '보',
  'ぱ': '파', 'ぴ': '피', 'ぷ': '푸', 'ぺ': '페', 'ぽ': '포',
  'ま': '마', 'み': '미', 'む': '무', 'め': '메', 'も': '모',
  'や': '야', 'ゆ': '유', 'よ': '요',
  'ら': '라', 'り': '리', 'る': '루', 'れ': '레', 'ろ': '로',
  'わ': '와', 'を': '오', 'ゔ': '부',
  'ぁ': '아', 'ぃ': '이', 'ぅ': '우', 'ぇ': '에', 'ぉ': '오', 'ゃ': '야', 'ゅ': '유', 'ょ': '요',
};

const HANGUL_BASE = 0xac00;
const JONG_N = 4;   // ㄴ
const JONG_S = 19;  // ㅅ

function addFinal(syllable: string, jong: number): string {
  const code = syllable.charCodeAt(0);
  if (code < 0xac00 || code > 0xd7a3) return syllable;
  const idx = code - HANGUL_BASE;
  if (idx % 28 !== 0) return syllable; // 이미 받침 있음
  return String.fromCharCode(code + jong);
}

function kataToHira(s: string): string {
  return s.replace(/[\u30a1-\u30f6]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0x60));
}

/** 문자열 안의 가나를 전부 한글 발음으로 변환. 가나가 없으면 원문 그대로. */
export function kanaToHangul(input: string): string {
  if (!input || !/[\u3040-\u30ff]/.test(input)) return input;
  const s = kataToHira(input).replace(/ー/g, '');
  let out = '';
  let i = 0;
  while (i < s.length) {
    const two = s.slice(i, i + 2);
    if (DIGRAPH[two]) { out += DIGRAPH[two]; i += 2; continue; }
    const ch = s[i];
    if (ch === 'っ') { out = out.slice(0, -1) + addFinal(out.slice(-1), JONG_S); i++; continue; }
    if (ch === 'ん') { out = out.slice(0, -1) + addFinal(out.slice(-1), JONG_N); i++; continue; }
    if (MONO[ch]) { out += MONO[ch]; i++; continue; }
    out += ch; i++; // 한글·문장부호·한자 등은 그대로
  }
  return out;
}

/** 의미 단위 분절 (조사 경계 휴리스틱) — AI가 안 띄우면 코드가 안전한 만큼만 띄운다.
 *  안전 조사만 사용: を·の·から·まで (단어 내부 출현이 사실상 없음) + 앞뒤 2글자 가드.
 *  원칙: 틀린 분리보다 안 하는 게 낫다 — 나머지 분절은 AI 프롬프트가 담당 */
export function segmentKana(s: string): string {
  if (/\s/.test(s)) return s; // AI가 이미 띄어 썼으면 존중
  let r = s;
  r = r.replace(/([^\s。、！？]{2})(から|まで)(?=[^\s。、！？]{2,})/g, '$1$2 ');
  r = r.replace(/([^\s。、！？]{2})(を|の)(?=[^\s。、！？]{2,})/g, '$1$2 ');
  return r;
}

/** jp: reading(한글 발음)을 기본으로, kana(히라가나 원본)를 토글용으로 함께 보존. en은 통과 */
export function forceKoreanReading<T extends { reading?: string; kana?: string }>(item: T, lang: string): T {
  if (lang !== 'jp') return item;
  // 이미 kana가 저장돼 있으면 → 분절 후 재변환 (옛 데이터도 소급 띄어쓰기)
  const src = item?.kana && /[\u3040-\u30ff]/.test(String(item.kana))
    ? String(item.kana)
    : (item?.reading && /[\u3040-\u30ff]/.test(String(item.reading)) ? String(item.reading) : null);
  if (!src) return item;
  const spaced = segmentKana(src);
  return { ...item, kana: spaced, reading: kanaToHangul(spaced) };
}
