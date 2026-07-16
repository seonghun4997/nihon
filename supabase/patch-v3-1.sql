-- v3.1 패치: 로그인을 휴대폰 기반으로 전환 (schema-v2를 이미 실행한 경우 이것만 Run)
alter table users alter column email drop not null;
alter table users add column if not exists referral text not null default '';
update users set phone = 'legacy-' || substr(id::text, 1, 8) where phone is null;
alter table users alter column phone set not null;
create unique index if not exists users_phone_key on users (phone);
