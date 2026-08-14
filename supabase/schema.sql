-- =====================================================================
-- Personal Portfolio — Public Read-only Schema (V1)
--
-- 사용법: Supabase Dashboard > SQL Editor 에 이 파일 전체를 붙여넣고 실행한다.
-- 여러 번 실행해도 안전하도록 작성되어 있다(idempotent).
--
-- 설계 원칙
--   1. 관리자 기능이 없는 V1 이므로 쓰기 정책을 아예 만들지 않는다.
--      anon 키가 공개돼도 insert/update/delete 가 RLS 에서 전부 막힌다.
--   2. 콘텐츠 수정은 Supabase 대시보드의 Table Editor 에서 직접 한다.
--   3. 정렬은 sort_order(작은 값이 위) → 기간 역순 순으로 결정한다.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 0. 공통 트리거 함수 — updated_at 자동 갱신
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- ---------------------------------------------------------------------
-- 1. projects — /work 목록과 /work/[slug] 케이스 스터디의 원본
-- ---------------------------------------------------------------------
create table if not exists public.projects (
  id            uuid primary key default gen_random_uuid(),

  slug          text unique not null,               -- URL 조각. 예: hrd-knowledge-portal
  title         text not null,
  summary       text not null default '',           -- 목록 카드에 노출되는 한 줄 요약
  category      text,                               -- 예: 웹 서비스 / 데이터 / 연구

  -- 케이스 스터디 본문: 문제 → 역할 → 핵심 판단 → 결과
  problem       text not null default '',           -- 어떤 문제였는가
  role          text not null default '',           -- 그 안에서 내 역할
  key_decisions text[] not null default '{}',       -- 핵심 판단 (근거와 함께 문장 단위로)
  outcome       text not null default '',           -- 결과 / 배운 것

  tech_stack    text[] not null default '{}',
  period_start  date,
  period_end    date,                               -- null 이면 진행 중으로 표시한다
  is_ongoing    boolean not null default false,

  -- 외부 참조 링크. 없으면 해당 항목을 화면에서 감춘다.
  github_url    text,
  blog_url      text,
  demo_url      text,
  pdf_url       text,

  is_featured   boolean not null default false,     -- 홈의 대표 프로젝트 3개 선별용
  sort_order    integer not null default 0,
  is_published  boolean not null default true,

  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists projects_sort_idx      on public.projects (sort_order, period_start desc);
create index if not exists projects_featured_idx  on public.projects (is_featured) where is_featured;
create index if not exists projects_published_idx on public.projects (is_published);

drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------
-- 2. experiences — /cv 경력
-- ---------------------------------------------------------------------
create table if not exists public.experiences (
  id              uuid primary key default gen_random_uuid(),

  org             text not null,                    -- 조직명
  title           text not null,                    -- 직함 / 역할
  employment_type text,                             -- 정규직 / 프리랜서 / 프로젝트 등
  location        text,

  period_start    date not null,
  period_end      date,                             -- null + is_current 로 "현재" 표기
  is_current      boolean not null default false,

  description     text not null default '',
  highlights      text[] not null default '{}',     -- 불릿으로 뿌려지는 성과 목록

  sort_order      integer not null default 0,
  is_published    boolean not null default true,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists experiences_sort_idx on public.experiences (sort_order, period_start desc);

drop trigger if exists experiences_set_updated_at on public.experiences;
create trigger experiences_set_updated_at
  before update on public.experiences
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------
-- 3. education — /cv 학력
-- ---------------------------------------------------------------------
create table if not exists public.education (
  id           uuid primary key default gen_random_uuid(),

  school       text not null,
  degree       text,                                -- 학사 / 석사 / 박사 / 수료 등
  field        text,                                -- 전공
  location     text,

  period_start date,
  period_end   date,
  is_current   boolean not null default false,

  note         text not null default '',            -- 논문 제목, 학점, 비고

  sort_order   integer not null default 0,
  is_published boolean not null default true,

  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists education_sort_idx on public.education (sort_order, period_start desc);

drop trigger if exists education_set_updated_at on public.education;
create trigger education_set_updated_at
  before update on public.education
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------
-- 4. research_plans — /research 연구 관심사 및 연구계획서
-- ---------------------------------------------------------------------
create table if not exists public.research_plans (
  id                 uuid primary key default gen_random_uuid(),

  slug               text unique not null,
  title              text not null,
  abstract           text not null default '',      -- 연구계획서 요약
  interests          text[] not null default '{}',  -- 연구 관심사 키워드
  research_questions text[] not null default '{}',  -- 연구 질문 (번호는 화면에서 매긴다)
  methodology        text not null default '',

  status             text not null default 'draft'
                     check (status in ('draft', 'in_progress', 'submitted', 'published')),

  pdf_url            text,                          -- 계획서 PDF 다운로드 링크
  reference_urls     text[] not null default '{}',  -- 참고문헌 / 관련 링크

  sort_order         integer not null default 0,
  is_published       boolean not null default true,

  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists research_plans_sort_idx on public.research_plans (sort_order, created_at desc);

drop trigger if exists research_plans_set_updated_at on public.research_plans;
create trigger research_plans_set_updated_at
  before update on public.research_plans
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------
-- 5. RLS — 공개 읽기 전용
--
--    select 정책 하나씩만 만든다. insert / update / delete 정책이 없으면
--    RLS 가 켜진 테이블에서는 해당 동작이 전부 거부된다.
--    is_published = false 인 행은 공개 사이트에서 아예 조회되지 않으므로
--    초안을 안전하게 보관할 수 있다.
-- ---------------------------------------------------------------------
alter table public.projects       enable row level security;
alter table public.experiences    enable row level security;
alter table public.education      enable row level security;
alter table public.research_plans enable row level security;

drop policy if exists "projects public read" on public.projects;
create policy "projects public read"
  on public.projects for select
  to anon, authenticated
  using (is_published);

drop policy if exists "experiences public read" on public.experiences;
create policy "experiences public read"
  on public.experiences for select
  to anon, authenticated
  using (is_published);

drop policy if exists "education public read" on public.education;
create policy "education public read"
  on public.education for select
  to anon, authenticated
  using (is_published);

drop policy if exists "research_plans public read" on public.research_plans;
create policy "research_plans public read"
  on public.research_plans for select
  to anon, authenticated
  using (is_published);


-- ---------------------------------------------------------------------
-- 6. (선택) PDF 저장용 Storage 버킷
--
--    이력서 / 연구계획서 PDF 를 Supabase Storage 에 두고 싶을 때만 실행한다.
--    공개 버킷이므로 URL 을 아는 사람은 누구나 받을 수 있다. 그래서
--    개인정보가 들어간 파일은 여기 올리지 않는다.
--    올린 뒤 얻는 공개 URL 을 projects.pdf_url / research_plans.pdf_url 에 넣는다.
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('documents', 'documents', true)
on conflict (id) do nothing;

drop policy if exists "documents public read" on storage.objects;
create policy "documents public read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'documents');
