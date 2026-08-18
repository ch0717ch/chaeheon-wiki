-- =====================================================================
-- V2: 다중 인물(문서) 위키 구조
--
-- 실행: Supabase SQL Editor 에 전체 붙여넣고 Run. 여러 번 실행해도 안전.
--
-- 바뀌는 것
--   1. profiles 테이블 신설 — 인물 문서 하나가 행 하나
--   2. 기존 6개 콘텐츠 테이블에 profile_id 연결
--   3. 기존 데이터(임채헌)를 첫 profiles 행으로 이전
--   4. 파일 업로드용 documents 버킷 (사진·PDF)
--
-- 쓰기 정책은 여전히 만들지 않는다. 웹 관리 기능은 서버의 service
-- role 키로만 쓰기를 수행하며, service role 은 RLS 를 우회한다.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. profiles — 인물 문서
-- ---------------------------------------------------------------------
create table if not exists public.people (
  id                uuid primary key default gen_random_uuid(),
  slug              text unique not null,          -- URL 조각. 예: chaeheon
  name              text not null,                 -- 이름
  name_en           text not null default '',
  title             text not null default '',      -- 한 줄 정체성
  intro             text not null default '',      -- 개요 첫 문단
  field_main        text not null default '',      -- 주 분야
  field_sub         text not null default '',      -- 부 분야
  keywords          text[] not null default '{}',
  mbti              text not null default '',
  birth_date        text not null default '',      -- 표기용 문자열
  location          text not null default '',
  languages         text not null default '',
  photo_url         text not null default '',      -- /images/.. 또는 업로드 URL
  resume_pdf_url    text not null default '',
  link_github       text not null default '',
  link_blog         text not null default '',
  link_blog2        text not null default '',      -- 두 번째 블로그
  link_instagram    text not null default '',
  link_email        text not null default '',
  link_linkedin     text not null default '',
  education_summary text[] not null default '{}',  -- 프로필 상자용 압축 학력
  expertise         jsonb not null default '[]',   -- [{title,summary,skills[]}]
  target_primary    text not null default '',      -- 지향 직무: 우선
  target_secondary  text not null default '',      -- 지향 직무: 확장
  target_edge       text not null default '',      -- 차별점
  sort_order        integer not null default 0,
  is_published      boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

drop trigger if exists people_set_updated_at on public.people;
create trigger people_set_updated_at
  before update on public.people
  for each row execute function public.set_updated_at();

alter table public.people enable row level security;

drop policy if exists "people public read" on public.people;
create policy "people public read"
  on public.people for select
  to anon, authenticated
  using (is_published);


-- ---------------------------------------------------------------------
-- 2. 콘텐츠 테이블에 profile_id 연결
-- ---------------------------------------------------------------------
alter table public.projects       add column if not exists profile_id uuid references public.people(id) on delete cascade;
alter table public.experiences    add column if not exists profile_id uuid references public.people(id) on delete cascade;
alter table public.education      add column if not exists profile_id uuid references public.people(id) on delete cascade;
alter table public.certifications add column if not exists profile_id uuid references public.people(id) on delete cascade;
alter table public.timeline       add column if not exists profile_id uuid references public.people(id) on delete cascade;
alter table public.research_plans add column if not exists profile_id uuid references public.people(id) on delete cascade;

create index if not exists projects_profile_idx       on public.projects (profile_id);
create index if not exists experiences_profile_idx    on public.experiences (profile_id);
create index if not exists education_profile_idx      on public.education (profile_id);
create index if not exists certifications_profile_idx on public.certifications (profile_id);
create index if not exists timeline_profile_idx       on public.timeline (profile_id);
create index if not exists research_plans_profile_idx on public.research_plans (profile_id);

-- projects.slug 는 이제 인물 안에서만 유일하면 된다.
alter table public.projects       drop constraint if exists projects_slug_key;
alter table public.research_plans drop constraint if exists research_plans_slug_key;
create unique index if not exists projects_profile_slug_idx       on public.projects (profile_id, slug);
create unique index if not exists research_plans_profile_slug_idx on public.research_plans (profile_id, slug);


-- ---------------------------------------------------------------------
-- 3. 기존 데이터를 임채헌 문서로 이전
-- ---------------------------------------------------------------------
insert into public.people (
  id, slug, name, name_en, title, intro, field_main, field_sub,
  keywords, mbti, birth_date, location, languages, photo_url,
  link_github, link_blog, link_blog2, link_instagram, link_email,
  education_summary, expertise,
  target_primary, target_secondary, target_edge, sort_order
) values (
  '77777777-7777-4777-8777-000000000001',
  'chaeheon',
  '임채헌', 'Chaeheon Lim',
  '기업교육·HRD · 디지털 업무혁신',
  '컴퓨터공학·영어통번역학·문헌정보학을 거치며 기술, 언어, 정보를 연결해 왔습니다. 기업교육 현장에서 운영과 강연자 섭외를 맡는 한편, 반복되는 데이터 업무를 직접 자동화합니다. AI 에이전트를 실무 도구로 쓰면서 확인한 생산성과 위험은 국제경영·정보보안 관점의 연구로 이어가고 있습니다.',
  '기업교육·HRD · 디지털 업무혁신 · 정보관리',
  '음악(세션·작·편곡) · 교육/강의 · 콘텐츠 창작',
  array['기업교육·HRD 운영','업무 자동화','데이터 수집·정규화','AI 에이전트 활용','정보검색·정보조직','글로벌 커뮤니케이션'],
  'ENTJ',
  '1999년 7월 17일',
  '경기도 안양시 · 대한민국',
  '한국어(모국어) · 영어(통번역학 학사) · 일본어(JLPT N2)',
  '/images/profile.jpg',
  'https://github.com/ch0717ch',
  'https://blog.naver.com/co0717gjs',
  'https://blog.naver.com/eddiequate',
  'https://instagram.com/eddiequate',
  'co0717gjs@naver.com',
  array['경기대학교 문헌정보학과 재학 (3학년 편입)','영어통번역학 학사','컴퓨터공학 학사','동안고등학교 졸업'],
  '[
    {"title":"기업교육 · HRD","summary":"교육 현장 운영부터 외부 강연자 섭외와 콘텐츠 구상까지.","skills":["기업교육 운영","교육기획","외부 강연자 조사·섭외","강사 전문성 검증","일정·예산·주제 조율","평가·자료 관리","교육 만족도 데이터 정리","온라인 교육 송출 (YouTube Live)","현장 운영 · 장비/비품 관리"]},
    {"title":"경영지원 · 프로젝트 운영","summary":"외부 이해관계자 협의를 구조화해 내부 의사결정으로 넘기는 일.","skills":["공식 비즈니스 메일 작성","유선 협의 · 대외 커뮤니케이션","협의 결과 구조화 및 내부 보고","일정 · 예산 관리","문서화 · 산출물 정리","요구사항 정의 · 우선순위 결정"]},
    {"title":"데이터 · 업무 자동화","summary":"반복 업무를 측정 가능한 결과로 바꾸는 작업.","skills":["Python","FastAPI","SQL","SQLite","관계형 데이터베이스","OpenPyXL","구조화 데이터 처리","변경 비교 · 이력 관리","Excel 결과 보고서","PPTX 문서 자동 생성","데이터 정규화 · 검증","배치 산출물 QA","Microsoft Excel 고급","PowerPoint"]},
    {"title":"개발 · 시스템","summary":"웹 서비스와 로컬 도구를 직접 만들고 배포한다.","skills":["Next.js","TypeScript","React","Tailwind CSS","Supabase","PostgreSQL · RLS","Netlify 배포","Java","반응형 웹","HTML/CSS/JavaScript","Linux","네트워크 관리","PC 하드웨어 조립·점검"]},
    {"title":"AI 활용","summary":"AI 코딩 에이전트를 구현 수단으로 두고 판단과 검증은 직접 한다.","skills":["Codex · Claude Code 활용","요구사항 구체화","작업 단위 분리 (task isolation)","수정 범위 명시 (edit boundary)","AI 실패 패턴 분석","산출물 기반 검증 (artifact-first QA)","API 연동","오류 분석 · 테스트","AI 거버넌스 · 보안 설계"]},
    {"title":"정보관리 · 문헌정보","summary":"정보를 찾고, 조직하고, 이용자에게 닿게 만드는 관점.","skills":["정보검색","데이터베이스","디지털도서관","정보서비스","정보조직 · 지식조직","콘텐츠 조직","정보원 평가","도서관 경영"]},
    {"title":"언어 · 글로벌","summary":"영어·일본어와 현지 체류 경험을 업무로 연결한다.","skills":["영어 통번역","영문 작성 · 에디팅","일본어 (JLPT N2)","문화 간 커뮤니케이션","다문화 협업","해외 체류 경험 (일본 · 말레이시아)"]},
    {"title":"교육 · 강의","summary":"학습자 수준을 진단하고 거기에 맞춰 설명하는 일.","skills":["컴퓨터 학원 강사","개인 과외 (수학 · 영어)","통기타 개인 레슨","학습자 수준 진단","맞춤형 진도 운영","실습 기반 교육 설계"]},
    {"title":"음악","summary":"세션 연주와 작·편곡. 제한된 시간 안에 요구사항을 결과물로 맞추는 훈련.","skills":["기타 (일렉 · 어쿠스틱)","베이스","드럼","보컬","작곡","편곡","세션 연주","드라마 OST 참여","아이돌 음악 제작 참여","악보 해석"]},
    {"title":"콘텐츠 · 창작","summary":"글, 영상, 채널을 직접 만들고 운영한다.","skills":["블로그 운영 (누적 방문 7만+)","검색 유입형 글쓰기","숏폼 · 릴스 제작","영상 기획 · 촬영 · 편집","집필 · 편집","출판물 구성 · 양장본 제작","개인 브랜딩"]}
  ]'::jsonb,
  'HRD · 기업교육 운영 / 교육기획 / 경영지원 / 프로젝트 운영',
  'DX · 업무혁신 / IT · 데이터 기반 기획 / 글로벌 사업 운영 / 국제 비즈니스',
  '교육 현장 경험 + 기술·데이터 활용 + 영어·일본어 + 다문화 적응 + 결과물 중심 실행력',
  10
)
on conflict (id) do nothing;

-- 기존 콘텐츠를 전부 임채헌 문서에 연결한다 (아직 연결 안 된 것만).
update public.projects       set profile_id = '77777777-7777-4777-8777-000000000001' where profile_id is null;
update public.experiences    set profile_id = '77777777-7777-4777-8777-000000000001' where profile_id is null;
update public.education      set profile_id = '77777777-7777-4777-8777-000000000001' where profile_id is null;
update public.certifications set profile_id = '77777777-7777-4777-8777-000000000001' where profile_id is null;
update public.timeline       set profile_id = '77777777-7777-4777-8777-000000000001' where profile_id is null;
update public.research_plans set profile_id = '77777777-7777-4777-8777-000000000001' where profile_id is null;


-- ---------------------------------------------------------------------
-- 4. 업로드 버킷 (사진 · PDF). 공개 읽기 전용.
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('documents', 'documents', true)
on conflict (id) do nothing;

drop policy if exists "documents public read" on storage.objects;
create policy "documents public read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'documents');
