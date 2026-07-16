-- ─────────────────────────────────────────────────────────────
-- nihon 스키마 v2 — 과외 OS (선생님↔학생 멀티유저)
-- Supabase SQL Editor에 전체 붙여넣고 Run 한 번.
-- 기존 jp_* 테이블(개인허브)은 건드리지 않음 — 그대로 보존됩니다.
-- ─────────────────────────────────────────────────────────────

-- 사용자 (owner=운영자 / teacher=선생님 / student=학생)
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text not null,
  phone text,
  password_hash text not null,
  role text not null check (role in ('owner','teacher','student')),
  approved boolean not null default false,   -- 선생님은 운영자 승인 필요
  created_at timestamptz not null default now()
);

-- 학생 초대 코드 (선생님이 발급 → 링크로 전달)
create table if not exists invites (
  code text primary key,
  teacher_id uuid not null references users(id) on delete cascade,
  used_by uuid references users(id),
  created_at timestamptz not null default now()
);

-- 수강 관계 (선생님↔학생) — 요금·정기 슬롯 포함
create table if not exists enrollments (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references users(id) on delete cascade,
  student_id uuid not null references users(id) on delete cascade,
  status text not null default 'active' check (status in ('active','paused','ended')),
  rate int not null default 0,               -- 원 단위
  rate_type text not null default 'per_lesson' check (rate_type in ('per_lesson','monthly')),
  slots jsonb not null default '[]',         -- [{weekday:2, time:"20:00", mode:"online"|"offline", place:"링크 또는 장소"}]
  memo text not null default '',
  created_at timestamptz not null default now(),
  unique (teacher_id, student_id)
);

-- 수업 노트 (심장 — 기존 jp_lessons의 멀티유저판)
create table if not exists lessons (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid references enrollments(id) on delete set null,
  student_id uuid not null references users(id) on delete cascade,
  teacher_id uuid references users(id) on delete set null,
  lesson_date date not null default (now() at time zone 'Asia/Seoul')::date,
  title text not null default '',
  raw_text text not null,
  note jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists lessons_student on lessons (student_id, lesson_date desc);

-- 단어 (간격 반복)
create table if not exists words (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references users(id) on delete cascade,
  lesson_id uuid references lessons(id) on delete set null,
  word text not null,
  reading text not null default '',
  meaning text not null default '',
  stage int not null default 0,
  next_due date,
  retired boolean not null default false,
  created_at timestamptz not null default now(),
  unique (student_id, word, meaning)
);
create index if not exists words_due on words (student_id, next_due) where retired = false;

-- 헷갈림 노트
create table if not exists confusions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references users(id) on delete cascade,
  lesson_id uuid references lessons(id) on delete set null,
  text text not null,
  count int not null default 1,
  last_seen date not null default (now() at time zone 'Asia/Seoul')::date,
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);

-- 질문 박스 (+ 선생님 답변 = 맥락 채팅 v1)
create table if not exists questions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references users(id) on delete cascade,
  enrollment_id uuid references enrollments(id) on delete set null,
  question text not null,
  ai_answer text not null default '',
  teacher_answer text not null default '',
  ask_teacher boolean not null default false,
  answered_at timestamptz,
  created_at timestamptz not null default now()
);

-- 다음 수업 주제 카드
create table if not exists topics (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references users(id) on delete cascade,
  for_date date not null,
  topics jsonb not null,
  selected int,
  created_at timestamptz not null default now(),
  unique (student_id, for_date)
);

-- 가나 드릴 (학생별)
create table if not exists kana (
  student_id uuid not null references users(id) on delete cascade,
  key text not null,
  correct int not null default 0,
  total int not null default 0,
  retired boolean not null default false,
  primary key (student_id, key)
);

-- 이어하기 회화
create table if not exists talks (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references users(id) on delete cascade,
  talk_date date not null default (now() at time zone 'Asia/Seoul')::date,
  lesson_id uuid references lessons(id) on delete set null,
  messages jsonb not null default '[]',
  turns int not null default 0,
  done boolean not null default false,
  created_at timestamptz not null default now(),
  unique (student_id, talk_date)
);

-- 활동 (스트릭·복습률)
create table if not exists activity (
  student_id uuid not null references users(id) on delete cascade,
  day date not null,
  primary key (student_id, day)
);

-- 출석 (정산의 원천 — 노트 생성 시 자동, 수동 +1 가능)
create table if not exists attendances (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references enrollments(id) on delete cascade,
  att_date date not null default (now() at time zone 'Asia/Seoul')::date,
  source text not null default 'auto' check (source in ('auto','manual')),
  lesson_id uuid references lessons(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists att_enr on attendances (enrollment_id, att_date desc);

-- 정산서 (월 단위)
create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references enrollments(id) on delete cascade,
  month text not null,                        -- 'YYYY-MM'
  lesson_count int not null default 0,
  amount int not null default 0,
  status text not null default 'draft' check (status in ('draft','sent','paid')),
  sent_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  unique (enrollment_id, month)
);

-- 선생님 리액션 (복습 체크의 1탭 응원)
create table if not exists reactions (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references enrollments(id) on delete cascade,
  student_id uuid not null references users(id) on delete cascade,
  teacher_id uuid not null references users(id) on delete cascade,
  emoji text not null default '👏',
  created_at timestamptz not null default now()
);

-- 수업 브리핑 (수업 전 자동/수동 생성 캐시)
create table if not exists briefings (
  enrollment_id uuid not null references enrollments(id) on delete cascade,
  for_date date not null,
  content text not null,
  created_at timestamptz not null default now(),
  primary key (enrollment_id, for_date)
);

-- ── N2 예약석 (데일리 재팬 — 지금은 비워둠) ──
create table if not exists daily_posts (
  id uuid primary key default gen_random_uuid(),
  publish_date date not null,
  level text not null default 'beginner',
  genre text not null default 'comedy',
  video_url text not null default '',
  expressions jsonb not null default '[]',
  quiz jsonb not null default '[]',
  status text not null default 'draft',
  created_at timestamptz not null default now()
);

-- RLS: 전부 켜고 정책 없음 → 서버(service_role)만 접근
do $$
declare t text;
begin
  foreach t in array array['users','invites','enrollments','lessons','words','confusions','questions','topics','kana','talks','activity','attendances','invoices','reactions','briefings','daily_posts']
  loop
    execute format('alter table %I enable row level security', t);
  end loop;
end $$;
