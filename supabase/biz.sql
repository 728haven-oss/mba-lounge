-- =====================================================================
-- MBA Lounge 비즈니스 매칭 (2026-11-28)
--   원우가 '가진 문제'와 '해줄 수 있는 것'을 프로필에 적고,
--   문제를 올리면 분야가 맞는 원우가 답변하거나 사람을 연결해 주고,
--   필요하면 프로젝트로 이어 가는 기능.
-- 이용 대상: 10개 학교의 승인된 회원(members.status = 'approved') 전체.
-- 금전 보상(소개비·포인트) 기능은 두지 않습니다. 감사는 공개 표시만.
-- Supabase SQL Editor 에 통째로 붙여넣고 실행. 여러 번 실행해도 안전합니다.
-- 기존 앱 테이블은 건드리지 않습니다.
-- =====================================================================

-- ---------- 도우미 ----------
create or replace function public.biz_is_member() returns boolean
language sql stable security definer set search_path = public as
$$ select exists (select 1 from public.members where id = auth.uid() and status = 'approved') $$;

create or replace function public.biz_is_admin() returns boolean
language sql stable security definer set search_path = public as
$$ select exists (select 1 from public.members where id = auth.uid() and status = 'approved' and role = 'admin') $$;

revoke all on function public.biz_is_member() from public;
revoke all on function public.biz_is_admin() from public;
grant execute on function public.biz_is_member() to authenticated;
grant execute on function public.biz_is_admin() to authenticated;

-- 분야 태그 (화면의 목록과 같아야 합니다)
create or replace function public.biz_tags_ok(t text[], lo int, hi int) returns boolean
language sql immutable as
$$ select coalesce(array_length(t,1),0) between lo and hi
     and t <@ array['투자·자금조달','마케팅·브랜딩','영업·판로','해외진출','법률·세무·회계','인사·조직',
                    'IT·AI·데이터','제조·공급망','부동산·건설','의료·헬스케어','금융·보험','유통·커머스',
                    '콘텐츠·문화','창업·스타트업','공공·정부지원','ESG·에너지']::text[] $$;

-- ---------- 1. 사업 프로필 ----------
create table if not exists public.biz_profiles (
  member_id  uuid primary key references auth.users(id) on delete cascade,
  name       text not null check (char_length(name) between 1 and 30),
  school_id  text not null,
  headline   text not null default '' check (char_length(headline) <= 80),   -- 회사·직함
  needs      text not null default '' check (char_length(needs) <= 500),     -- 제가 가진 문제
  offers     text not null default '' check (char_length(offers) <= 500),    -- 제가 해줄 수 있는 것
  tags       text[] not null check (public.biz_tags_ok(tags, 1, 5)),
  updated_at timestamptz not null default now()
);
alter table public.biz_profiles enable row level security;
drop policy if exists biz_profiles_read  on public.biz_profiles;
drop policy if exists biz_profiles_write on public.biz_profiles;
drop policy if exists biz_profiles_upd   on public.biz_profiles;
drop policy if exists biz_profiles_del   on public.biz_profiles;
create policy biz_profiles_read  on public.biz_profiles for select to authenticated using (public.biz_is_member());
create policy biz_profiles_write on public.biz_profiles for insert to authenticated
  with check (member_id = auth.uid() and public.biz_is_member()
              and school_id = public.site_me_school());
create policy biz_profiles_upd   on public.biz_profiles for update to authenticated
  using (member_id = auth.uid())
  with check (member_id = auth.uid() and school_id = public.site_me_school());
create policy biz_profiles_del   on public.biz_profiles for delete to authenticated using (member_id = auth.uid());

-- 연락처는 따로 둔다: 본인, 그리고 연결이 성사된 상대에게만 보인다
create table if not exists public.biz_contacts (
  member_id uuid primary key references auth.users(id) on delete cascade,
  contact   text not null default '' check (char_length(contact) <= 120)
);
alter table public.biz_contacts enable row level security;

-- ---------- 2. 문제 ----------
create table if not exists public.biz_questions (
  id           uuid primary key default gen_random_uuid(),
  author       uuid not null references auth.users(id) on delete cascade,
  author_label text not null check (char_length(author_label) between 1 and 60),  -- 이름, 익명이면 직함
  school_id    text not null,
  body         text not null check (char_length(body) between 10 and 1000),
  want         text not null check (want in ('answer','connect','both')),
  tags         text[] not null check (public.biz_tags_ok(tags, 1, 3)),
  anonymous    boolean not null default false,
  status       text not null default 'open' check (status in ('open','resolved','closed')),
  created_at   timestamptz not null default now(),
  resolved_at  timestamptz
);
create index if not exists biz_questions_created_idx on public.biz_questions (created_at desc);
create index if not exists biz_questions_tags_idx on public.biz_questions using gin (tags);
alter table public.biz_questions enable row level security;
drop policy if exists biz_q_read on public.biz_questions;
drop policy if exists biz_q_ins  on public.biz_questions;
drop policy if exists biz_q_upd  on public.biz_questions;
drop policy if exists biz_q_del  on public.biz_questions;
create policy biz_q_read on public.biz_questions for select to authenticated using (public.biz_is_member());
create policy biz_q_ins  on public.biz_questions for insert to authenticated
  with check (author = auth.uid() and public.biz_is_member() and status = 'open'
              and school_id = public.site_me_school());
create policy biz_q_upd  on public.biz_questions for update to authenticated
  using (author = auth.uid() or public.biz_is_admin())
  with check (author = auth.uid() or public.biz_is_admin());
create policy biz_q_del  on public.biz_questions for delete to authenticated
  using (author = auth.uid() or public.biz_is_admin());

-- ---------- 3. 답변 ----------
create table if not exists public.biz_answers (
  id           uuid primary key default gen_random_uuid(),
  question_id  uuid not null references public.biz_questions(id) on delete cascade,
  author       uuid not null references auth.users(id) on delete cascade,
  author_label text not null check (char_length(author_label) between 1 and 60),
  body         text not null check (char_length(body) between 2 and 2000),
  created_at   timestamptz not null default now()
);
create index if not exists biz_answers_q_idx on public.biz_answers (question_id, created_at);
alter table public.biz_answers enable row level security;
drop policy if exists biz_a_read on public.biz_answers;
drop policy if exists biz_a_ins  on public.biz_answers;
drop policy if exists biz_a_del  on public.biz_answers;
create policy biz_a_read on public.biz_answers for select to authenticated using (public.biz_is_member());
create policy biz_a_ins  on public.biz_answers for insert to authenticated
  with check (author = auth.uid() and public.biz_is_member());
create policy biz_a_del  on public.biz_answers for delete to authenticated
  using (author = auth.uid() or public.biz_is_admin());

-- 도움됐어요 (답변당 1인 1회)
create table if not exists public.biz_helpful (
  answer_id  uuid not null references public.biz_answers(id) on delete cascade,
  member_id  uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (answer_id, member_id)
);
alter table public.biz_helpful enable row level security;
drop policy if exists biz_h_read on public.biz_helpful;
drop policy if exists biz_h_ins  on public.biz_helpful;
drop policy if exists biz_h_del  on public.biz_helpful;
create policy biz_h_read on public.biz_helpful for select to authenticated using (public.biz_is_member());
create policy biz_h_ins  on public.biz_helpful for insert to authenticated
  with check (member_id = auth.uid() and public.biz_is_member()
              and not exists (select 1 from public.biz_answers a where a.id = answer_id and a.author = auth.uid()));
create policy biz_h_del  on public.biz_helpful for delete to authenticated using (member_id = auth.uid());

-- ---------- 4. 사람 연결 제안 ----------
-- type: member(원우 소개) / external(비회원 소개, 연락처 저장 안 함) / self(제가 직접 도울게요)
create table if not exists public.biz_connections (
  id             uuid primary key default gen_random_uuid(),
  question_id    uuid not null references public.biz_questions(id) on delete cascade,
  proposer       uuid not null references auth.users(id) on delete cascade,
  proposer_label text not null check (char_length(proposer_label) between 1 and 60),
  type           text not null check (type in ('member','external','self')),
  target_member  uuid references auth.users(id) on delete set null,
  target_label   text not null default '' check (char_length(target_label) <= 80),
  message        text not null default '' check (char_length(message) <= 500),
  status         text not null default 'proposed' check (status in ('proposed','accepted','declined')),
  stage          text check (stage in ('chatting','met','collaborating')),
  created_at     timestamptz not null default now(),
  decided_at     timestamptz,
  check (type <> 'member' or target_member is not null)
);
create index if not exists biz_conn_q_idx on public.biz_connections (question_id, created_at);
alter table public.biz_connections enable row level security;
drop policy if exists biz_c_read on public.biz_connections;
drop policy if exists biz_c_ins  on public.biz_connections;
drop policy if exists biz_c_del  on public.biz_connections;
create policy biz_c_read on public.biz_connections for select to authenticated using (public.biz_is_member());
create policy biz_c_ins  on public.biz_connections for insert to authenticated
  with check (proposer = auth.uid() and public.biz_is_member() and status = 'proposed' and stage is null
              and not exists (select 1 from public.biz_questions q where q.id = question_id and q.author = auth.uid()));
create policy biz_c_del  on public.biz_connections for delete to authenticated
  using ((proposer = auth.uid() and status = 'proposed') or public.biz_is_admin());
-- 상태 변경은 아래 함수로만 (직접 UPDATE 권한 없음)

-- 연락처 공개 정책: 본인, 또는 같은 성사된 연결의 당사자(작성자·제안자·소개 대상)
drop policy if exists biz_contacts_own  on public.biz_contacts;
drop policy if exists biz_contacts_read on public.biz_contacts;
drop policy if exists biz_contacts_upd  on public.biz_contacts;
drop policy if exists biz_contacts_ins  on public.biz_contacts;
create policy biz_contacts_ins on public.biz_contacts for insert to authenticated
  with check (member_id = auth.uid() and public.biz_is_member());
create policy biz_contacts_upd on public.biz_contacts for update to authenticated
  using (member_id = auth.uid()) with check (member_id = auth.uid());
create policy biz_contacts_read on public.biz_contacts for select to authenticated
  using (member_id = auth.uid() or exists (
    select 1 from public.biz_connections c join public.biz_questions q on q.id = c.question_id
    where c.status = 'accepted'
      and auth.uid() in (q.author, c.proposer, c.target_member)
      and biz_contacts.member_id in (q.author, c.proposer, c.target_member)));

-- 작성자가 연결 제안을 수락·거절
create or replace function public.biz_respond(p_conn uuid, p_accept boolean) returns void
language plpgsql security definer set search_path = public as
$$
begin
  update public.biz_connections c
     set status = case when p_accept then 'accepted' else 'declined' end,
         stage  = case when p_accept then 'chatting' else null end,
         decided_at = now()
   where c.id = p_conn and c.status = 'proposed'
     and exists (select 1 from public.biz_questions q where q.id = c.question_id and q.author = auth.uid());
  if not found then raise exception 'not allowed'; end if;
end $$;

-- 성사된 연결의 진행 단계 (당사자 누구나)
create or replace function public.biz_set_stage(p_conn uuid, p_stage text) returns void
language plpgsql security definer set search_path = public as
$$
begin
  if p_stage not in ('chatting','met','collaborating') then raise exception 'bad stage'; end if;
  update public.biz_connections c set stage = p_stage
   where c.id = p_conn and c.status = 'accepted'
     and (auth.uid() = c.proposer or auth.uid() = c.target_member
          or exists (select 1 from public.biz_questions q where q.id = c.question_id and q.author = auth.uid()));
  if not found then raise exception 'not allowed'; end if;
end $$;

-- ---------- 5. 프로젝트 ----------
create table if not exists public.biz_projects (
  id           uuid primary key default gen_random_uuid(),
  title        text not null check (char_length(title) between 2 and 80),
  description  text not null check (char_length(description) between 10 and 2000),
  origin_question uuid references public.biz_questions(id) on delete set null,
  tags         text[] not null default '{}' check (public.biz_tags_ok(tags, 0, 3)),
  leader       uuid not null references auth.users(id) on delete cascade,
  leader_label text not null check (char_length(leader_label) between 1 and 60),
  status       text not null default 'recruiting' check (status in ('recruiting','running','done')),
  deadline     date,
  created_at   timestamptz not null default now()
);
alter table public.biz_projects enable row level security;
drop policy if exists biz_p_read on public.biz_projects;
drop policy if exists biz_p_ins  on public.biz_projects;
drop policy if exists biz_p_upd  on public.biz_projects;
drop policy if exists biz_p_del  on public.biz_projects;
create policy biz_p_read on public.biz_projects for select to authenticated using (public.biz_is_member());
create policy biz_p_ins  on public.biz_projects for insert to authenticated
  with check (leader = auth.uid() and public.biz_is_member());
create policy biz_p_upd  on public.biz_projects for update to authenticated
  using (leader = auth.uid() or public.biz_is_admin())
  with check (leader = auth.uid() or public.biz_is_admin());
create policy biz_p_del  on public.biz_projects for delete to authenticated
  using (leader = auth.uid() or public.biz_is_admin());

create table if not exists public.biz_project_roles (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null references public.biz_projects(id) on delete cascade,
  name         text not null check (char_length(name) between 1 and 40),
  member_id    uuid references auth.users(id) on delete set null,
  member_label text not null default '' check (char_length(member_label) <= 60),
  status       text not null default 'open' check (status in ('open','applied','filled')),
  created_at   timestamptz not null default now()
);
create index if not exists biz_roles_p_idx on public.biz_project_roles (project_id, created_at);
alter table public.biz_project_roles enable row level security;
drop policy if exists biz_r_read on public.biz_project_roles;
drop policy if exists biz_r_ins  on public.biz_project_roles;
drop policy if exists biz_r_del  on public.biz_project_roles;
create policy biz_r_read on public.biz_project_roles for select to authenticated using (public.biz_is_member());
create policy biz_r_ins  on public.biz_project_roles for insert to authenticated
  with check (status = 'open' and member_id is null
              and exists (select 1 from public.biz_projects p where p.id = project_id and p.leader = auth.uid()));
create policy biz_r_del  on public.biz_project_roles for delete to authenticated
  using (exists (select 1 from public.biz_projects p where p.id = project_id and p.leader = auth.uid()));

-- 역할 참여 신청 / 철회
create or replace function public.biz_apply_role(p_role uuid, p_label text, p_apply boolean) returns void
language plpgsql security definer set search_path = public as
$$
begin
  if not public.biz_is_member() then raise exception 'not allowed'; end if;
  if p_apply then
    update public.biz_project_roles set status = 'applied', member_id = auth.uid(), member_label = left(coalesce(p_label,''), 60)
     where id = p_role and status = 'open';
  else
    update public.biz_project_roles set status = 'open', member_id = null, member_label = ''
     where id = p_role and status = 'applied' and member_id = auth.uid();
  end if;
  if not found then raise exception 'not available'; end if;
end $$;

-- 리더가 신청을 승인·반려
create or replace function public.biz_decide_role(p_role uuid, p_approve boolean) returns void
language plpgsql security definer set search_path = public as
$$
begin
  update public.biz_project_roles r
     set status = case when p_approve then 'filled' else 'open' end,
         member_id = case when p_approve then r.member_id else null end,
         member_label = case when p_approve then r.member_label else '' end
   where r.id = p_role and r.status = 'applied'
     and exists (select 1 from public.biz_projects p where p.id = r.project_id and p.leader = auth.uid());
  if not found then raise exception 'not allowed'; end if;
end $$;

revoke all on function public.biz_respond(uuid, boolean)            from public;
revoke all on function public.biz_set_stage(uuid, text)             from public;
revoke all on function public.biz_apply_role(uuid, text, boolean)   from public;
revoke all on function public.biz_decide_role(uuid, boolean)        from public;
grant execute on function public.biz_respond(uuid, boolean)          to authenticated;
grant execute on function public.biz_set_stage(uuid, text)           to authenticated;
grant execute on function public.biz_apply_role(uuid, text, boolean) to authenticated;
grant execute on function public.biz_decide_role(uuid, boolean)      to authenticated;

-- ---------- 테이블 권한 (범위는 위 RLS 가 정함) ----------
grant select, insert, update, delete on public.biz_profiles      to authenticated;
grant select, insert, update         on public.biz_contacts      to authenticated;
grant select, insert, update, delete on public.biz_questions     to authenticated;
grant select, insert, delete         on public.biz_answers       to authenticated;
grant select, insert, delete         on public.biz_helpful       to authenticated;
grant select, insert, delete         on public.biz_connections   to authenticated;
grant select, insert, update, delete on public.biz_projects      to authenticated;
grant select, insert, delete         on public.biz_project_roles to authenticated;
