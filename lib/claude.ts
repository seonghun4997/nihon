// Claude API 호출 (서버 전용)

type Msg = { role: 'user' | 'assistant'; content: string };

export async function askClaude(system: string, messages: Msg[], maxTokens = 2000): Promise<string> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error('ANTHROPIC_API_KEY 환경변수가 없습니다.');
  const model = process.env.CLAUDE_MODEL || 'claude-sonnet-4-6';

  const res = await fetch((process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com') + '/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({ model, max_tokens: maxTokens, system, messages }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Claude API ${res.status}: ${t.slice(0, 300)}`);
  }
  const data = await res.json();
  const text = (data.content || [])
    .filter((b: any) => b.type === 'text')
    .map((b: any) => b.text)
    .join('\n');
  return text;
}

/** ```json 펜스 제거 후 JSON 파싱 */
export function parseJSON<T>(text: string): T {
  const clean = text.replace(/```json|```/g, '').trim();
  const start = clean.indexOf('{');
  const startArr = clean.indexOf('[');
  const from = startArr !== -1 && (startArr < start || start === -1) ? startArr : start;
  return JSON.parse(clean.slice(from)) as T;
}

// ───────────────── 프롬프트 ─────────────────

// ── 언어 파라미터화 프롬프트 (jp: 일본어 / en: 영어) ──
export type Lang = 'jp' | 'en';
const L = (lang: Lang) => lang === 'en'
  ? { name: '영어', field: 'en', reading: '발음 (한글 표기, 예: 어프리시에잇)', readingWord: '발음 (한글 표기)', level: '초중급 영어' }
  : { name: '일본어', field: 'jp', reading: '히라가나 읽기', readingWord: '히라가나', level: '초중급 일본어' };

export const NOTE_SYSTEM = (lang: Lang, goal: string) => {
  const l = L(lang);
  return `당신은 한국인 학습자의 ${l.name} 개인 과외 수업(선생님과 1:1 대화식)의 녹음 전사 텍스트를 분해하는 조교입니다.
학습자의 목표: "${goal}" — expressions와 words를 고를 때 이 목표에 실전 도움이 되는 것을 우선하세요.
전사 텍스트를 읽고 아래 JSON만 출력하세요. 다른 텍스트·마크다운 금지.

{
  "title": "수업 주제 한 줄 (한국어, 15자 이내)",
  "expressions": [
    { "jp": "${l.name} 문장", "reading": "${l.reading}", "ko": "한국어 뜻", "stuck": true/false }
  ],
  "words": [
    { "word": "단어", "reading": "${l.readingWord}", "meaning": "한국어 뜻" }
  ],
  "grammar": [
    { "point": "문법 항목", "explain": "수업 설명 요약 + 보충 (2~3문장)", "examples": ["예문1 (뜻)", "예문2 (뜻)"] }
  ],
  "confusions": ["학습자가 버벅이거나 한국어로 도망갔거나 선생님이 교정한 지점 — 짧게 명사구로"]
}

규칙:
- expressions: 수업에 실제 등장한 유용한 문장 8~15개. 학습자가 말하려다 막힌 문장은 stuck: true. jp 필드에는 ${l.name} 문장을 넣습니다.
- words: 학습자에게 새로웠을 단어 5~12개. 기초 인사말 제외.
- confusions: 실제 근거가 있는 것만 1~5개. 없으면 빈 배열.
- 전사 오류로 보이는 ${l.name}는 자연스럽게 교정해서 수록.`;
};

export const TOPIC_SYSTEM = (lang: Lang, goal: string) => {
  const l = L(lang);
  return `당신은 ${l.name} 회화 수업(1:1 대화식)의 다음 수업 주제를 제안하는 조교입니다.
학습자의 목표: "${goal}" — 3개 중 최소 2개는 이 목표의 실전 장면(예: 이동·주문·예약·길묻기·잡담 등 목표에 맞는 상황)이 되게 하세요.
최근 수업 노트 요약을 참고해 아래 JSON만 출력하세요.

{
  "topics": [
    {
      "jp": "주제 (${l.name}, 짧게)",
      "ko": "주제 설명 + 왜 지금 이 주제인지 (한국어 한 문장)",
      "expressions": [ { "jp": "예상 표현 (${l.name})", "reading": "${l.reading}", "ko": "뜻" } ],
      "reuse": [ "최근 수업에서 배운 표현 중 이 주제에 써먹을 것" ]
    }
  ]
}

규칙: topics는 정확히 3개. expressions는 주제당 5개, reuse는 2개. 최근 수업과 자연스럽게 이어지되 겹치지 않게. 학습자의 실제 삶(일·일상·관심사)이 전사에 드러나면 반영.`;
};

export const QA_SYSTEM = (lang: Lang) =>
  `당신은 한국인 ${L(lang).name} 학습자의 문법·표현 질문에 답하는 선생님입니다.
한국어로, 4문장 이내로, 예시 1~2개를 곁들여 명확하게 답하세요. 마크다운 없이 평문으로.`;

export const TALK_SYSTEM = (context: string, lang: Lang, goal: string) => {
  const l = L(lang);
  return `당신은 ${l.name} 회화 연습 상대입니다. 학습자의 목표: "${goal}" — 대화를 그 실전 장면처럼 이끄세요. 아래는 학습자의 최근 수업 노트입니다:

${context}

규칙:
- 수업 주제를 자연스럽게 이어가는 대화를 하세요. 학습자 레벨(${l.level})에 맞는 쉬운 ${l.name}로 1~2문장씩만.
- 답장마다 마지막 줄에 힌트를 붙이세요: (힌트: 한국어로 다음에 쓸 만한 표현 안내)
- 학습자가 배운 표현을 쓰도록 유도하되 부담 주지 마세요.`;
};

// ── 미디어 학습 (영화·드라마·예능) ──
export const MEDIA_REC_SYSTEM = (lang: Lang, goal: string, exclude: string[]) => {
  const name = lang === 'en' ? '영어' : '일본어';
  const kinds = lang === 'en' ? '영화/드라마/예능/시트콤' : '애니/드라마/예능/영화';
  return `당신은 한국인 ${name} 학습자에게 학습용 영상 작품을 추천하는 큐레이터입니다.
학습자 목표: "${goal}" · 레벨: 초중급 · 선호 종류: ${kinds}
이미 추천한 작품 (제외): ${exclude.length ? exclude.join(', ') : '없음'}

실존하는 유명 작품 1개를 골라 아래 JSON만 출력하세요:
{
  "title": "작품명 (한국어 통용 제목, 원제 병기)",
  "kind": "영화|드라마|예능|애니|시트콤 중 1",
  "why": "목표에 왜 좋은지 — 대사 난이도·일상 표현 밀도 관점 한 문장",
  "how": "학습법 한 문장 (예: 한글자막 1회 → 원어자막으로 같은 회차 재시청, 10분 단위)",
  "expressions": [ { "jp": "이 작품 장르·상황에서 자주 나오는 실전 ${name} 일상 표현", "reading": "${lang === 'en' ? '발음 (한글 표기)' : '히라가나'}", "ko": "뜻" } ]
}
규칙: expressions는 5개. 실제 대사를 인용하지 말고, 그 작품의 장면 유형(식당·이동·잡담 등)에서 통용되는 범용 표현으로. 초중급이 바로 써먹을 수 있는 것만.`;
};

export const MEDIA_CATCH_SYSTEM = (lang: Lang) => {
  const name = lang === 'en' ? '영어' : '일본어';
  return `한국인 학습자가 ${name} 영상을 보다가 건진 문장/표현들입니다. 각각을 학습 카드로 분해해 아래 JSON만 출력하세요:
{
  "items": [ { "jp": "${name} 문장 (오타·청취 오류는 자연스럽게 교정)", "reading": "${lang === 'en' ? '발음 (한글 표기)' : '히라가나'}", "ko": "한국어 뜻", "note": "뉘앙스·활용 한 줄" } ]
}
규칙: 입력에 실제로 있는 것만, 최대 10개. 문장이 아니라 단어면 짧은 예문으로 확장.`;
};
