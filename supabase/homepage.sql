-- =====================================================================
-- MBA Lounge 홈페이지용 테이블 (공개 게시판 · 학교 소식)
-- Supabase 대시보드 → SQL Editor 에 통째로 붙여넣고 한 번 실행합니다.
-- 기존 앱 테이블(members, posts 등)은 건드리지 않습니다. 여러 번 실행해도 안전합니다.
-- =====================================================================

-- ---------- 1. 도우미 함수 ----------
-- RLS 정책 안에서 "지금 로그인한 사람"의 회원 정보를 읽는다.
-- security definer: members 의 RLS 와 무관하게 본인 행 하나만 본다.
create or replace function public.site_me_status() returns text
language sql stable security definer set search_path = public as
$$ select status from public.members where id = auth.uid() $$;

create or replace function public.site_me_school() returns text
language sql stable security definer set search_path = public as
$$ select school_id from public.members where id = auth.uid() $$;

create or replace function public.site_is_school_admin(p_school text) returns boolean
language sql stable security definer set search_path = public as
$$ select exists (select 1 from public.members
                  where id = auth.uid() and role = 'admin' and status = 'approved' and school_id = p_school) $$;

revoke all on function public.site_me_status() from public;
revoke all on function public.site_me_school() from public;
revoke all on function public.site_is_school_admin(text) from public;
grant execute on function public.site_me_status() to anon, authenticated;
grant execute on function public.site_me_school() to anon, authenticated;
grant execute on function public.site_is_school_admin(text) to anon, authenticated;

-- ---------- 2. 공개 게시판 ----------
-- 누구나 읽기. 가입한 회원(승인 대기 포함, 거절 제외)은 자기 학교 이름으로 쓰기.
create table if not exists public.site_posts (
  id           uuid primary key default gen_random_uuid(),
  author       uuid not null references auth.users(id) on delete cascade,
  school_id    text not null,
  cat          text not null default 'free' check (cat in ('free','qna','event','job')),
  title        text not null check (char_length(title) between 1 and 120),
  body         text not null check (char_length(body) between 1 and 5000),
  author_label text not null default '원우' check (char_length(author_label) <= 20),  -- 가린 이름 (예: 김*집)
  created_at   timestamptz not null default now()
);
create index if not exists site_posts_created_idx on public.site_posts (created_at desc);
create index if not exists site_posts_school_idx  on public.site_posts (school_id, created_at desc);
alter table public.site_posts enable row level security;

drop policy if exists site_posts_read   on public.site_posts;
drop policy if exists site_posts_insert on public.site_posts;
drop policy if exists site_posts_delete on public.site_posts;
create policy site_posts_read on public.site_posts for select to anon, authenticated using (true);
create policy site_posts_insert on public.site_posts for insert to authenticated
  with check (author = auth.uid()
              and public.site_me_status() in ('pending','approved')
              and school_id = public.site_me_school());
-- 본인 글, 또는 같은 학교 관리자가 삭제
create policy site_posts_delete on public.site_posts for delete to authenticated
  using (author = auth.uid() or public.site_is_school_admin(school_id));

create table if not exists public.site_comments (
  id           uuid primary key default gen_random_uuid(),
  post_id      uuid not null references public.site_posts(id) on delete cascade,
  author       uuid not null references auth.users(id) on delete cascade,
  author_label text not null default '원우' check (char_length(author_label) <= 20),
  body         text not null check (char_length(body) between 1 and 1000),
  created_at   timestamptz not null default now()
);
create index if not exists site_comments_post_idx on public.site_comments (post_id, created_at);
alter table public.site_comments enable row level security;

drop policy if exists site_comments_read   on public.site_comments;
drop policy if exists site_comments_insert on public.site_comments;
drop policy if exists site_comments_delete on public.site_comments;
create policy site_comments_read on public.site_comments for select to anon, authenticated using (true);
create policy site_comments_insert on public.site_comments for insert to authenticated
  with check (author = auth.uid() and public.site_me_status() in ('pending','approved'));
create policy site_comments_delete on public.site_comments for delete to authenticated
  using (author = auth.uid()
         or exists (select 1 from public.site_posts p where p.id = post_id and public.site_is_school_admin(p.school_id)));

-- ---------- 3. 학교 소식 (관리자가 등록하는 공식 기사 링크) ----------
create table if not exists public.school_news (
  id           uuid primary key default gen_random_uuid(),
  school_id    text not null,
  title        text not null check (char_length(title) between 1 and 160),
  url          text not null check (url ~ '^https://'),
  source_name  text not null check (char_length(source_name) between 1 and 60),
  published_on date not null,
  summary      text not null default '' check (char_length(summary) <= 300),
  added_by     uuid references auth.users(id) on delete set null,
  created_at   timestamptz not null default now(),
  unique (school_id, url)
);
create index if not exists school_news_school_idx on public.school_news (school_id, published_on desc);
alter table public.school_news enable row level security;

drop policy if exists school_news_read   on public.school_news;
drop policy if exists school_news_insert on public.school_news;
drop policy if exists school_news_delete on public.school_news;
create policy school_news_read on public.school_news for select to anon, authenticated using (true);
create policy school_news_insert on public.school_news for insert to authenticated
  with check (public.site_is_school_admin(school_id) and added_by = auth.uid());
create policy school_news_delete on public.school_news for delete to authenticated
  using (public.site_is_school_admin(school_id));

-- =====================================================================
-- 4. 점검 (실행 결과만 확인하세요. 아무것도 바꾸지 않습니다)
-- 홈페이지는 승인 대기 회원도 로그인 상태를 유지합니다(공개 게시판을 쓰기 위해).
-- 학교 커뮤니티 테이블의 읽기 정책이 "로그인만 하면 허용"으로 되어 있다면
-- 승인 대기 회원도 API로 커뮤니티 글을 읽을 수 있습니다.
-- 아래 결과의 qual 열에 status = 'approved' 조건이 있는지 확인하세요.
-- =====================================================================
select tablename, policyname, cmd, roles, qual
from pg_policies
where schemaname = 'public'
  and tablename in ('members','posts','comments','post_likes','meets','meet_joins','notices',
                    'jokbo','jokbo_entries','ratings','clubs','club_members','club_notices',
                    'club_ledger','club_requests','exchanges')
order by tablename, cmd;

-- 조건이 없다면, 예를 들어 posts 는 이렇게 바꿉니다 (정책 이름은 위 결과에 맞추세요):
--   create or replace function public.site_is_approved_in(p_school text) returns boolean
--   language sql stable security definer set search_path = public as
--   $$ select exists (select 1 from public.members
--                     where id = auth.uid() and status = 'approved' and school_id = p_school) $$;
--   alter policy "<기존 posts select 정책 이름>" on public.posts
--     using (public.site_is_approved_in(school_id));
