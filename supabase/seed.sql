-- =====================================================================
-- Personal Portfolio — 초기 시드 데이터
--
-- 사용법: schema.sql 을 먼저 실행한 뒤 이 파일을 SQL Editor 에서 실행한다.
-- 고정 UUID + on conflict do update 이므로 여러 번 실행해도 중복되지 않고
-- 값만 덮어쓴다. 내용은 전부 자리표시자다 — 본인 정보로 바꿔서 쓴다.
--
-- 바꿔야 할 것: 이름, 조직, 기간, 링크(GITHUB_USERNAME / BLOG_URL / EMAIL).
-- =====================================================================


-- ---------------------------------------------------------------------
-- projects
-- ---------------------------------------------------------------------
insert into public.projects (
  id, slug, title, summary, category,
  problem, role, key_decisions, outcome,
  tech_stack, period_start, period_end, is_ongoing,
  github_url, blog_url, demo_url, pdf_url,
  is_featured, sort_order
) values
(
  '11111111-1111-4111-8111-000000000001',
  'hrd-knowledge-portal',
  'HRD Strategic Circle 지식 포털',
  'HRD 실무자 네트워크를 위한 비공개 자료 아카이브. 계정 발급부터 열람 권한까지 직접 설계했다.',
  '웹 서비스',
  'HRD 리더 모임의 자료가 카카오톡과 개인 메일에 흩어져 있었다. 새로 합류한 사람은 과거 자료에 접근할 방법이 없었고, 자료를 공유한 사람도 누가 무엇을 봤는지 알 수 없었다. 공개 웹에 올릴 수는 없는 내부 자료라 검색 노출도 막아야 했다.',
  '기획부터 배포까지 단독으로 맡았다. 요구사항 정리, 데이터 모델 설계, 프론트엔드 구현, Supabase 인증·권한 설정, Netlify 배포 및 운영을 담당했다.',
  array[
    '이메일 가입 대신 관리자가 계정을 발급하는 방식을 택했다. 폐쇄형 모임이라 가입 심사 흐름을 만드는 비용이 실익보다 컸다.',
    '자료를 카테고리별 테이블로 쪼개지 않고 단일 contents 테이블 + category 컬럼으로 두었다. 카테고리가 앞으로 계속 늘어날 것이 분명했기 때문이다.',
    '첨부파일 버킷을 private 으로 두고 서버에서 signed URL 을 발급했다. 공개 URL 방식은 링크가 한 번 새면 회수할 방법이 없다.',
    'robots 를 noindex 로 고정했다. 로그인 벽이 있어도 제목과 메타데이터가 검색에 걸리는 것 자체가 문제였다.'
  ],
  '모임 자료를 한 곳에 모으고 신규 합류자가 과거 아카이브를 바로 열람할 수 있게 됐다. 관리자 화면에서 계정 발급과 콘텐츠 등록이 끝나 운영에 개발자가 붙지 않아도 된다.',
  array['Next.js', 'TypeScript', 'Tailwind CSS', 'Supabase', 'Netlify'],
  '2026-07-01', null, true,
  'https://github.com/GITHUB_USERNAME/hrd-web-site', null, null, null,
  true, 10
),
(
  '11111111-1111-4111-8111-000000000002',
  'sample-data-pipeline',
  '교육 성과 데이터 파이프라인',
  '흩어진 교육 이수·평가 데이터를 하나의 지표 테이블로 모으고 월간 리포트를 자동화한 작업.',
  '데이터',
  '교육 운영 데이터가 LMS, 설문 도구, 수기 엑셀 세 곳에 나뉘어 있었다. 월간 보고서를 만들 때마다 사람이 손으로 합치느라 이틀이 들었고, 그 과정에서 집계 기준이 매번 조금씩 달라졌다.',
  '데이터 모델 설계와 집계 로직 작성을 맡았다. 현업 담당자와 지표 정의를 합의하는 과정도 직접 진행했다.',
  array[
    '자동화보다 지표 정의 합의를 먼저 했다. 기준이 흔들리는 상태에서 파이프라인을 만들면 틀린 숫자를 빠르게 만드는 도구가 될 뿐이다.',
    '원본 데이터를 변형하지 않고 그대로 적재한 뒤 집계 뷰에서만 가공했다. 기준이 바뀌어도 재적재 없이 뷰만 고치면 된다.',
    '실패한 행을 조용히 버리지 않고 별도 테이블에 쌓았다. 조용한 누락은 잘못된 숫자보다 발견이 늦다.'
  ],
  '보고서 작성 시간이 이틀에서 반나절로 줄었다. 집계 기준이 문서로 남아 담당자가 바뀌어도 같은 숫자가 나온다.',
  array['Python', 'PostgreSQL', 'dbt'],
  '2026-02-01', '2026-06-30', false,
  'https://github.com/GITHUB_USERNAME/sample-data-pipeline', 'https://BLOG_URL/posts/data-pipeline', null, null,
  true, 20
),
(
  '11111111-1111-4111-8111-000000000003',
  'sample-research-tool',
  '연구 문헌 정리 도구',
  '읽은 논문을 질문 단위로 묶어 보관하는 개인용 도구. 연구계획서 초안 작성 과정에서 만들었다.',
  '연구',
  '논문을 읽을수록 메모가 늘어나는데, 정작 "이 질문에 대해 지금까지 뭘 읽었지"를 되짚기 어려웠다. 참고문헌 관리 도구는 문헌 단위로만 정리돼 있어 질문 중심으로 다시 묶을 수 없었다.',
  '개인 프로젝트로 혼자 설계하고 만들었다.',
  array[
    '문헌이 아니라 연구 질문을 최상위 단위로 잡았다. 같은 논문이 여러 질문에 붙는 것이 실제 사용 패턴과 맞았다.',
    '전문 검색 대신 태그와 수동 연결만 넣었다. 개인 규모에서는 검색보다 정리 자체가 병목이었다.'
  ],
  '연구계획서 문헌 검토 절을 쓸 때 질문별로 근거를 바로 꺼낼 수 있었다. 초안 작성 기간이 눈에 띄게 줄었다.',
  array['Next.js', 'TypeScript', 'SQLite'],
  '2025-11-01', '2026-01-31', false,
  'https://github.com/GITHUB_USERNAME/sample-research-tool', null, null, null,
  true, 30
),
(
  '11111111-1111-4111-8111-000000000004',
  'sample-archive-site',
  '개인 작업 아카이브',
  '지금 보고 있는 이 사이트. CV·프로젝트·연구계획서를 한 곳에서 참조할 수 있게 정리했다.',
  '웹 서비스',
  '이력서, 포트폴리오, 연구계획서가 각각 다른 파일과 플랫폼에 있었다. 누군가에게 보낼 때마다 링크를 세 개씩 모아야 했고, 어느 버전이 최신인지 헷갈렸다.',
  '기획, 디자인, 구현, 배포 전부.',
  array[
    '콘텐츠를 코드에 하드코딩하지 않고 Supabase 테이블에 두었다. 내용은 계속 바뀌는데 배포를 다시 하고 싶지 않았다.',
    '관리자 화면을 만들지 않았다. 혼자 쓰는 사이트에서 대시보드 직접 수정으로 충분한데 인증·권한 코드를 짊어질 이유가 없다.',
    '나무위키식 목차·각주 형식을 택했다. 랜딩 페이지가 아니라 참조용 문서라는 성격을 형식으로 드러내고 싶었다.'
  ],
  '링크 하나로 전체 이력을 전달할 수 있게 됐다. 내용 수정이 배포와 분리되어 유지 비용이 거의 없다.',
  array['Next.js', 'TypeScript', 'Tailwind CSS', 'Supabase', 'Netlify'],
  '2026-08-01', null, true,
  'https://github.com/GITHUB_USERNAME/portfolio-site', null, null, null,
  false, 40
)
on conflict (id) do update set
  slug = excluded.slug, title = excluded.title, summary = excluded.summary,
  category = excluded.category, problem = excluded.problem, role = excluded.role,
  key_decisions = excluded.key_decisions, outcome = excluded.outcome,
  tech_stack = excluded.tech_stack, period_start = excluded.period_start,
  period_end = excluded.period_end, is_ongoing = excluded.is_ongoing,
  github_url = excluded.github_url, blog_url = excluded.blog_url,
  demo_url = excluded.demo_url, pdf_url = excluded.pdf_url,
  is_featured = excluded.is_featured, sort_order = excluded.sort_order;


-- ---------------------------------------------------------------------
-- experiences
-- ---------------------------------------------------------------------
insert into public.experiences (
  id, org, title, employment_type, location,
  period_start, period_end, is_current,
  description, highlights, sort_order
) values
(
  '22222222-2222-4222-8222-000000000001',
  '국제경영원', 'HRD 기획 담당', '정규직', '서울',
  '2024-03-01', null, true,
  '교육 프로그램 기획과 운영, 그리고 그 과정을 지탱하는 내부 도구를 함께 맡고 있다.',
  array[
    'HRD 리더 네트워크용 비공개 지식 포털을 기획부터 배포까지 단독 수행',
    '교육 성과 데이터 집계 기준을 문서화하고 월간 리포트 작성 시간을 75% 단축',
    '연간 교육 과정 개편안 작성 및 실행'
  ],
  10
),
(
  '22222222-2222-4222-8222-000000000002',
  '이전 소속 조직', '이전 직함', '정규직', '서울',
  '2022-01-01', '2024-02-29', false,
  '이 항목은 자리표시자다. Supabase 대시보드의 experiences 테이블에서 실제 경력으로 바꾼다.',
  array[
    '담당했던 일과 그 결과를 한 줄씩 적는다',
    '가능하면 숫자를 포함한다'
  ],
  20
)
on conflict (id) do update set
  org = excluded.org, title = excluded.title, employment_type = excluded.employment_type,
  location = excluded.location, period_start = excluded.period_start,
  period_end = excluded.period_end, is_current = excluded.is_current,
  description = excluded.description, highlights = excluded.highlights,
  sort_order = excluded.sort_order;


-- ---------------------------------------------------------------------
-- education
-- ---------------------------------------------------------------------
insert into public.education (
  id, school, degree, field, location,
  period_start, period_end, is_current, note, sort_order
) values
(
  '33333333-3333-4333-8333-000000000001',
  '대학원 이름', '석사 과정', '교육학 / HRD', '서울',
  '2026-03-01', null, true,
  '연구 관심사는 /research 문서에 정리해 두었다. 이 항목은 자리표시자다.',
  10
),
(
  '33333333-3333-4333-8333-000000000002',
  '대학교 이름', '학사', '전공명', '서울',
  '2018-03-01', '2022-02-28', false,
  '이 항목은 자리표시자다. education 테이블에서 실제 학력으로 바꾼다.',
  20
)
on conflict (id) do update set
  school = excluded.school, degree = excluded.degree, field = excluded.field,
  location = excluded.location, period_start = excluded.period_start,
  period_end = excluded.period_end, is_current = excluded.is_current,
  note = excluded.note, sort_order = excluded.sort_order;


-- ---------------------------------------------------------------------
-- research_plans
-- ---------------------------------------------------------------------
insert into public.research_plans (
  id, slug, title, abstract, interests, research_questions,
  methodology, status, pdf_url, reference_urls, sort_order
) values
(
  '44444444-4444-4444-8444-000000000001',
  'hrd-knowledge-transfer',
  '조직 내 암묵지 이전과 학습 아카이브의 관계',
  '조직에서 축적된 경험은 대부분 문서가 아니라 사람에게 남는다. 담당자가 바뀌면 그 지식은 대체로 소실되고, 조직은 같은 시행착오를 반복한다. 이 연구는 내부 학습 아카이브가 실제로 암묵지 이전에 기여하는지, 기여한다면 어떤 조건에서 그런지를 확인하려 한다. 특히 아카이브의 존재 자체보다 접근 권한 설계와 검색 경로가 이전 효과를 좌우한다는 가설을 검증한다.',
  array['조직 학습', '암묵지 이전', 'HRD 성과 측정', '지식 관리 시스템', '학습 전이'],
  array[
    '내부 학습 아카이브의 도입은 신규 구성원의 업무 적응 기간을 실제로 단축시키는가?',
    '아카이브의 접근 권한 구조(전면 공개 / 부서 한정 / 승인 기반)에 따라 활용도와 지식 이전 효과는 어떻게 달라지는가?',
    '문서화된 지식과 사람 간 상호작용은 대체 관계인가, 보완 관계인가?'
  ],
  '혼합 연구 설계를 사용한다. 1단계로 아카이브를 운영 중인 조직 3-4곳의 접근 로그와 인사 데이터를 연결해 적응 기간 차이를 정량 분석한다. 2단계로 각 조직의 신규 구성원과 지식 제공자를 대상으로 반구조화 면담을 진행해, 로그가 설명하지 못하는 이용 맥락을 확인한다.',
  'draft',
  null,
  array['https://BLOG_URL/posts/research-note-1'],
  10
)
on conflict (id) do update set
  slug = excluded.slug, title = excluded.title, abstract = excluded.abstract,
  interests = excluded.interests, research_questions = excluded.research_questions,
  methodology = excluded.methodology, status = excluded.status,
  pdf_url = excluded.pdf_url, reference_urls = excluded.reference_urls,
  sort_order = excluded.sort_order;
