-- =====================================================================
-- schema — education · research_plans · certifications · timeline
--
-- 01 -> 02 -> 03 순서로 실행한다. 여러 번 실행해도 안전하다.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 3. education — /cv 학력
-- ---------------------------------------------------------------------
create table if not exists public.education (
  id           uuid primary key default gen_random_uuid(),

  -- 기관명을 밝히지 않을 학력도 있으므로 null 을 허용한다.
  -- 이때는 화면에서 전공/학위가 제목 자리를 대신한다.
  school       text,
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

-- 이미 school 이 not null 로 만들어진 DB 를 위한 보정. 새 DB 에서는 아무 일도 하지 않는다.
alter table public.education alter column school drop not null;

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
-- 4-1. certifications — /cv 자격 및 면허
-- ---------------------------------------------------------------------
create table if not exists public.certifications (
  id           uuid primary key default gen_random_uuid(),

  name         text not null,                       -- 자격/면허 명칭
  issuer       text,                                -- 발급 기관
  kind         text not null default 'certificate'
               check (kind in ('certificate', 'license', 'course', 'award')),
  issued_on    date,                                -- 취득일 (모르면 비워 둔다)
  note         text not null default '',

  sort_order   integer not null default 0,
  is_published boolean not null default true,

  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists certifications_sort_idx on public.certifications (sort_order, issued_on desc);

drop trigger if exists certifications_set_updated_at on public.certifications;
create trigger certifications_set_updated_at
  before update on public.certifications
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------
-- 4-2. timeline — /cv 연혁
--
--    경력·학력·자격에 담기지 않는 활동(음악활동, 교육과정 수료, 대외활동
--    등)을 연도순으로 늘어놓는 표다. 날짜를 모르는 항목도 실을 수 있도록
--    year 만 필수로 두고 month 는 선택으로 뒀다.
-- ---------------------------------------------------------------------
create table if not exists public.timeline (
  id           uuid primary key default gen_random_uuid(),

  year         integer not null,
  month        integer check (month between 1 and 12),
  end_year     integer,                             -- 기간 활동이면 종료 연도
  title        text not null,
  category     text not null default '활동',        -- 활동 / 교육 / 경력 / 학력 / 자격
  note         text not null default '',

  sort_order   integer not null default 0,
  is_published boolean not null default true,

  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists timeline_year_idx on public.timeline (year desc, month desc);

drop trigger if exists timeline_set_updated_at on public.timeline;
create trigger timeline_set_updated_at
  before update on public.timeline
  for each row execute function public.set_updated_at();
