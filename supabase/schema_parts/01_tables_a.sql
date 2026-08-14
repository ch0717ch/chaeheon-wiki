-- =====================================================================
-- schema — 트리거 함수 · projects · experiences
--
-- 01 -> 02 -> 03 순서로 실행한다. 여러 번 실행해도 안전하다.
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
