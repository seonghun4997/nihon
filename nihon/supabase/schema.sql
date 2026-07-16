-- 일본어 허브 스키마 v1 — Supabase SQL Editor에 붙여넣고 Run 한 번이면 끝.
-- 오너 단독 앱 + 서버(service_role)만 접근하므로 RLS는 "전부 잠금"으로 둡니다.

create table if not exists jp_lessons (
  id uuid primary key default gen_random_uuid(),
  lesson_date date not null default (now() at time zone 'Asia/Seoul')::date,
  title text not null default '',
  raw_text text not null,
  note jsonb not null,          -- { expressions, grammar } (단어·헷갈림은 별도 테이블로 분리 적립)
  created_at timestamptz not null default now()
);

create table if not exists jp_words (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid references jp_lessons(id) on delete set null,
  word text not null,
  reading text not null default '',
  meaning text not null default '',
  stage int not null default 0,          -- 0→D1, 1→D3, 2→D7, 3→D21
  next_due date,                          -- null이면 은퇴(졸업)
  retired boolean not null default false,
  created_at timestamptz not null default now(),
  unique (word, meaning)                  -- 같은 단어 중복 적립 방지
);
create index if not exists jp_words_due on jp_words (next_due) where retired = false;

create table if not exists jp_confusions (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid references jp_lessons(id) on delete set null,
  text text not null,
  count int not null default 1,           -- 반복 등장 횟수 (2회 이상 = ⭐)
  last_seen date not null default (now() at time zone 'Asia/Seoul')::date,
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists jp_questions (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null default '',
  ask_teacher boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists jp_topics (
  id uuid primary key default gen_random_uuid(),
  for_date date not null,                 -- 어느 수업일을 위한 주제인가
  topics jsonb not null,                  -- [{jp, ko, expressions[], reuse[]}] x3
  selected int,                           -- 0|1|2 (고른 카드)
  created_at timestamptz not null default now(),
  unique (for_date)
);

create table if not exists jp_kana (
  key text primary key,                   -- 'hira-ka' 등 행 단위
  correct int not null default 0,
  total int not null default 0,
  retired boolean not null default false
);

create table if not exists jp_talks (
  id uuid primary key default gen_random_uuid(),
  talk_date date not null default (now() at time zone 'Asia/Seoul')::date,
  lesson_id uuid references jp_lessons(id) on delete set null,
  messages jsonb not null default '[]',   -- [{role, content}]
  turns int not null default 0,           -- 내 발화 턴 수 (3턴이면 완료)
  done boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists jp_activity (
  day date primary key,                   -- 스트릭 계산용: 뭔가 한 날
  created_at timestamptz not null default now()
);

-- RLS: 켜되 정책 없음 → anon/authenticated 접근 차단, service_role만 통과
alter table jp_lessons    enable row level security;
alter table jp_words      enable row level security;
alter table jp_confusions enable row level security;
alter table jp_questions  enable row level security;
alter table jp_topics     enable row level security;
alter table jp_kana       enable row level security;
alter table jp_talks      enable row level security;
alter table jp_activity   enable row level security;
