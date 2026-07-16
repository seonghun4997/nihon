-- v4 패치: 오너 전용 + 다국어(일본어·영어) 전환
-- SQL Editor에 전체 붙여넣고 Run 한 번. (schema-v2가 먼저 실행돼 있어야 합니다)

-- 1) 언어 컬럼
alter table lessons    add column if not exists lang text not null default 'jp';
alter table words      add column if not exists lang text not null default 'jp';
alter table confusions add column if not exists lang text not null default 'jp';
alter table questions  add column if not exists lang text not null default 'jp';
alter table topics     add column if not exists lang text not null default 'jp';
alter table talks      add column if not exists lang text not null default 'jp';

-- 주제·회화의 유니크 제약을 언어 포함으로 교체
alter table topics drop constraint if exists topics_student_id_for_date_key;
create unique index if not exists topics_uni on topics (student_id, lang, for_date);
alter table talks drop constraint if exists talks_student_id_talk_date_key;
create unique index if not exists talks_uni on talks (student_id, lang, talk_date);

-- 2) 언어별 수업 요일 (기본: 일본어 화·금 / 영어 금)
create table if not exists jp_prefs (
  lang text primary key check (lang in ('jp','en')),
  weekdays jsonb not null default '[]'
);
insert into jp_prefs (lang, weekdays) values ('jp', '[2,5]') on conflict (lang) do nothing;
insert into jp_prefs (lang, weekdays) values ('en', '[5]') on conflict (lang) do nothing;
alter table jp_prefs enable row level security;

-- 3) 오너 단일 사용자 행 (접속 코드 로그인이 이 행을 사용)
insert into users (id, name, phone, password_hash, role, approved)
values ('00000000-0000-0000-0000-000000000001', '성훈', '00000000000', 'owner-mode', 'student', true)
on conflict (id) do nothing;

-- 4) 학습 목표 (모든 AI 호출에 주입 — 노트 선별·주제 방향·회화 장면)
alter table jp_prefs add column if not exists goal text not null default '여행 가서 막힘없이 일상 대화';

-- 5) v4.2 집요 복습 — 말하기 테스트 항목 (막힌 표현이 SRS를 탐)
create table if not exists speaks (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references users(id) on delete cascade,
  lang text not null default 'jp',
  text text not null,
  reading text not null default '',
  ko text not null default '',
  stage int not null default 0,
  next_due date,
  retired boolean not null default false,
  created_at timestamptz not null default now(),
  unique (student_id, lang, text)
);
alter table speaks enable row level security;

-- 헷갈림 해결에 연속 2회 정답 요구 (집요 모드)
alter table confusions add column if not exists win_streak int not null default 0;
