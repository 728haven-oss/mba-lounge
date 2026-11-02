-- =====================================================================
-- MBA Lounge 홈페이지 보강 (2026-11-02)
--   1) 공개 게시판·학교 소식 테이블 권한(GRANT) 추가
--      → 지금 홈페이지 공개 게시판이 "불러오지 못했습니다"로 나오는 원인
--        (테이블은 있으나 anon/authenticated 역할에 SELECT 권한이 없음)
--   2) 의견·오류 신고 테이블 site_feedback
-- Supabase 대시보드 → SQL Editor 에 통째로 붙여넣고 실행. 여러 번 실행해도 안전합니다.
-- 기존 앱 테이블은 건드리지 않습니다.
-- =====================================================================

-- ---------- 1. 기존 홈페이지 테이블 권한 ----------
-- 접근 범위는 homepage.sql 의 RLS 정책이 그대로 정합니다. (GRANT 는 '테이블을 쓸 수 있는가', RLS 는 '어떤 행인가')
grant select on public.site_posts    to anon, authenticated;
grant select on public.site_comments to anon, authenticated;
grant select on public.school_news   to anon, authenticated;
grant insert, delete on public.site_posts    to authenticated;
grant insert, delete on public.site_comments to authenticated;
grant insert, delete on public.school_news   to authenticated;

-- ---------- 2. 의견·오류 신고 ----------
create table if not exists public.site_feedback (
  id             uuid primary key default gen_random_uuid(),
  created_at     timestamptz not null default now(),
  kind           text not null check (kind in ('bug','inconvenience','suggestion','other')),
  message        text not null check (char_length(message) between 5 and 3000),
  page           text not null default '' check (char_length(page) <= 300),      -- 어느 페이지에서 보냈는지
  error_info     text not null default '' check (char_length(error_info) <= 2000), -- 자동 첨부된 오류·브라우저 정보
  contact        text not null default '' check (char_length(contact) <= 120),     -- 비회원이 남긴 연락처(선택)
  reporter       uuid references auth.users(id) on delete set null,                -- 로그인 회원이면 본인 id
  reporter_label text not null default '' check (char_length(reporter_label) <= 40),
  school_id      text,                                                              -- 회원의 학교 (비회원은 null)
  status         text not null default 'new' check (status in ('new','checking','done','wontfix')),
  reply          text not null default '' check (char_length(reply) <= 1000),       -- 운영자 답변 (보낸 회원에게 보임)
  updated_at     timestamptz not null default now()
);
create index if not exists site_feedback_created_idx on public.site_feedback (created_at desc);
create index if not exists site_feedback_status_idx  on public.site_feedback (status, created_at desc);
alter table public.site_feedback enable row level security;

-- 관리자 여부 (어느 학교든 승인된 관리자)
create or replace function public.site_admin_school() returns text
language sql stable security definer set search_path = public as
$$ select school_id from public.members where id = auth.uid() and role = 'admin' and status = 'approved' $$;
revoke all on function public.site_admin_school() from public;
grant execute on function public.site_admin_school() to anon, authenticated;

drop policy if exists site_feedback_insert      on public.site_feedback;
drop policy if exists site_feedback_read_own    on public.site_feedback;
drop policy if exists site_feedback_read_admin  on public.site_feedback;
drop policy if exists site_feedback_update_admin on public.site_feedback;

-- 누구나 보낼 수 있다. 회원은 본인 id 로만, 비회원은 reporter 없이. 상태·답변은 새 글 상태로만.
create policy site_feedback_insert on public.site_feedback for insert to anon, authenticated
  with check ((reporter is null or reporter = auth.uid()) and status = 'new' and reply = ''
              and (school_id is null or school_id = public.site_me_school()));
-- 회원은 자기가 보낸 의견과 답변을 본다
create policy site_feedback_read_own on public.site_feedback for select to authenticated
  using (reporter = auth.uid());
-- 학교 관리자는 자기 학교 회원의 의견 + 학교가 없는(비회원·전체) 의견을 본다
create policy site_feedback_read_admin on public.site_feedback for select to authenticated
  using (public.site_admin_school() is not null
         and (school_id is null or school_id = public.site_admin_school()));
create policy site_feedback_update_admin on public.site_feedback for update to authenticated
  using (public.site_admin_school() is not null
         and (school_id is null or school_id = public.site_admin_school()))
  with check (public.site_admin_school() is not null);

grant insert on public.site_feedback to anon, authenticated;
grant select on public.site_feedback to authenticated;
grant update (status, reply, updated_at) on public.site_feedback to authenticated;

-- 짧은 시간에 같은 내용이 반복되는 도배 방지: 1분 안에 같은 메시지는 거절
create or replace function public.site_feedback_guard() returns trigger
language plpgsql security definer set search_path = public as
$$
begin
  if exists (select 1 from public.site_feedback
             where message = new.message and created_at > now() - interval '1 minute') then
    raise exception 'duplicate feedback';
  end if;
  if (select count(*) from public.site_feedback where created_at > now() - interval '10 minutes') > 60 then
    raise exception 'too many feedback';
  end if;
  return new;
end $$;
drop trigger if exists site_feedback_guard on public.site_feedback;
create trigger site_feedback_guard before insert on public.site_feedback
  for each row execute function public.site_feedback_guard();

create or replace function public.site_feedback_touch() returns trigger
language plpgsql as $$ begin new.updated_at = now(); return new; end $$;
drop trigger if exists site_feedback_touch on public.site_feedback;
create trigger site_feedback_touch before update on public.site_feedback
  for each row execute function public.site_feedback_touch();
