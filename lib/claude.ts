// Claude API 호출 (서버 전용)

type Msg = { role: 'user' | 'assistant'; content: string };

export async function askClaude(system: string, messages: Msg[], maxTokens = 2000): Promise<string> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error('ANTHROPIC_API_KEY 환경변수가 없습니다.');
  const model = process.env.CLAUDE_MODEL || 'claude-sonnet-4-6';

  const res = await fetch('https://api.anthropic.com/v1/messages', {
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

export const NOTE_SYSTEM = `당신은 한국인 학습자의 일본어 개인 과외 수업(선생님과 1:1 대화식)의 녹음 전사 텍스트를 분해하는 조교입니다.
전사 텍스트를 읽고 아래 JSON만 출력하세요. 다른 텍스트·마크다운 금지.

{
  "title": "수업 주제 한 줄 (한국어, 15자 이내)",
  "expressions": [
    { "jp": "일본어 문장", "reading": "히라가나 읽기", "ko": "한국어 뜻", "stuck": true/false }
  ],
  "words": [
    { "word": "단어(한자 포함)", "reading": "히라가나", "meaning": "한국어 뜻" }
  ],
  "grammar": [
    { "point": "문법 항목", "explain": "수업 설명 요약 + 보충 (2~3문장)", "examples": ["예문1 (뜻)", "예문2 (뜻)"] }
  ],
  "confusions": ["학습자가 버벅이거나 한국어로 도망갔거나 선생님이 교정한 지점 — 짧게 명사구로"]
}

규칙:
- expressions: 수업에 실제 등장한 유용한 문장 8~15개. 학습자가 말하려다 막힌 문장은 stuck: true.
- words: 학습자에게 새로웠을 단어 5~12개. 조사·기초 인사말 제외.
- confusions: 실제 근거가 있는 것만 1~5개. 없으면 빈 배열.
- 전사 오류로 보이는 일본어는 자연스럽게 교정해서 수록.`;

export const TOPIC_SYSTEM = `당신은 일본어 회화 수업(1:1 대화식)의 다음 수업 주제를 제안하는 조교입니다.
최근 수업 노트 요약을 참고해 아래 JSON만 출력하세요.

{
  "topics": [
    {
      "jp": "주제 (일본어, 짧게)",
      "ko": "주제 설명 + 왜 지금 이 주제인지 (한국어 한 문장)",
      "expressions": [ { "jp": "예상 표현", "reading": "히라가나", "ko": "뜻" } ],  // 5개
      "reuse": [ "최근 수업에서 배운 표현 중 이 주제에 써먹을 것" ]  // 2개
    }
  ]
}

규칙: topics는 정확히 3개. 최근 수업과 자연스럽게 이어지되 겹치지 않게. 학습자의 실제 삶(일·일상·관심사)이 전사에 드러나면 반영.`;

export const QA_SYSTEM = `당신은 한국인 일본어 학습자의 문법·표현 질문에 답하는 선생님입니다.
한국어로, 4문장 이내로, 예시 1~2개를 곁들여 명확하게 답하세요. 마크다운 없이 평문으로.`;

export const TALK_SYSTEM = (context: string) => `당신은 일본어 회화 연습 상대입니다. 아래는 학습자의 최근 수업 노트입니다:

${context}

규칙:
- 수업 주제를 자연스럽게 이어가는 대화를 하세요. 학습자 레벨(초중급)에 맞는 쉬운 일본어로 1~2문장씩만.
- 답장마다 마지막 줄에 힌트를 붙이세요: (힌트: 한국어로 다음에 쓸 만한 표현 안내)
- 학습자가 배운 표현을 쓰도록 유도하되 부담 주지 마세요.`;

export const BRIEFING_SYSTEM = `당신은 일본어 과외 선생님의 조교입니다. 아래 자료로 오늘 수업 브리핑을 만드세요.
한국어로, 마크다운 없이, 아래 형식 그대로 짧게:

[지난 수업 요약] 2문장
[오늘 추천 흐름] 학생이 고른 주제가 있으면 그걸 중심으로, 없으면 지난 수업 이어가기 — 2문장
[학생이 물어볼 것] 질문 목록 그대로 나열 (없으면 "없음")
[반복 헷갈림 — 짚어주기] 항목 나열 (없으면 "없음")
[이번 주 복습] 복습률과 한 줄 코멘트`;
