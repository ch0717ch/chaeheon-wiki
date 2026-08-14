# 개인 작업 아카이브 (Portfolio Site)

CV · 프로젝트 포트폴리오 · 연구계획서를 한곳에 모아 두는 공개 허브다.
나무위키식 목차/참조 형식으로 구성했고, 콘텐츠는 Supabase 에서 읽어 온다.

**공개 읽기 전용 V1** — 관리자 화면이 없다. 콘텐츠는 Supabase 대시보드에서 직접 수정한다.

| 항목 | 내용 |
| --- | --- |
| 프레임워크 | Next.js 15 (App Router) + TypeScript |
| 스타일 | Tailwind CSS v4 (CSS-first `@theme`) |
| 데이터 | Supabase (PostgreSQL + RLS) |
| 배포 | Netlify (`@netlify/plugin-nextjs`) |

---

## 1. 페이지 구성

| 경로 | 문서 | 내용 |
| --- | --- | --- |
| `/` | 개요 | 자기소개, 핵심 키워드, 대표 프로젝트 3개, 외부 링크 |
| `/cv` | 이력 | 경력, 학력, 역량, 이력 요약 |
| `/work` | 작업 | 프로젝트 목록 (분류별 그룹) |
| `/work/[slug]` | 케이스 스터디 | 문제 → 역할 → 핵심 판단 → 결과 → 참조 링크 |
| `/research` | 연구 | 연구 관심사, 연구 질문, 계획서 요약, PDF 링크 |
| `/contact` | 연락 | 외부 링크와 연락처 |

`/sitemap.xml`, `/robots.txt` 는 자동 생성된다.

## 2. 디렉터리

```
app/            페이지 (App Router)
components/     SiteNav · WikiDoc(목차/섹션) · InfoBox · Prose · Links · ProjectEntry
lib/
  site.ts       ★ 이름 · 소개 · 외부 링크 등 사이트 소유자 정보
  supabase.ts   anon 키 기반 읽기 전용 클라이언트
  queries.ts    테이블별 조회 (실패해도 빈 배열 반환)
  format.ts     날짜/문단 포맷
supabase/
  schema.sql    테이블 · 인덱스 · RLS · Storage 정책
  seed.sql      초기 시드 데이터
types/index.ts  DB 행 타입
```

---

## 3. 로컬 실행

### 3.1. Supabase 준비

1. [supabase.com](https://supabase.com) 에서 새 프로젝트를 만든다.
2. **SQL Editor** 에서 `supabase/schema.sql` 전체를 붙여넣고 실행한다.
3. 이어서 `supabase/seed.sql` 을 실행한다. (자리표시자 데이터가 들어간다)
4. **Project Settings → Data API** 에서 `Project URL` 을 복사한다.
5. **Project Settings → API Keys** 에서 `Publishable key`(또는 `anon` 키)를 복사한다.

> `service_role` / `secret` 키는 이 프로젝트에서 쓰지 않는다. 쓰기 경로가 없다.

### 3.2. 환경변수

`.env.local.example` 을 `.env.local` 로 복사하고 값을 채운다.

```bash
copy .env.local.example .env.local
```

| 변수 | 설명 |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Publishable / anon 키. RLS 로 select 만 허용되므로 공개돼도 안전하다 |
| `NEXT_PUBLIC_SITE_URL` | 사이트 주소. 메타데이터와 sitemap 에 쓰인다 |

### 3.3. 실행

```bash
npm install
```

```bash
npm run dev
```

http://localhost:7799 에서 확인한다.

환경변수가 비어 있어도 빌드와 실행은 성공한다. 대신 각 섹션이
"아직 등록된 항목이 없다" 안내로 채워진다.

### 3.4. 검사

```bash
npm run typecheck
```

```bash
npm run lint
```

---

## 4. 내 정보로 바꾸기

### 4.1. 코드에서 바꾸는 것

`lib/site.ts` 한 파일만 고치면 된다.

- `name`, `nameEn`, `title` — 이름과 한 줄 정체성
- `intro` — 홈 첫 문단
- `keywords` — 핵심 키워드 (6개 안팎)
- `links.github` / `links.blog` / `links.email` / `links.linkedin` — 빈 문자열이면 화면에서 자동으로 숨는다
- `location`, `resumePdfUrl`

### 4.2. Supabase 대시보드에서 바꾸는 것

**Table Editor** 에서 직접 편집한다.

| 테이블 | 화면 |
| --- | --- |
| `projects` | `/`, `/work`, `/work/[slug]` |
| `experiences` | `/cv` 경력 |
| `education` | `/cv` 학력 |
| `research_plans` | `/research` |

편집 시 알아 둘 것:

- `is_published = false` 로 두면 사이트에 노출되지 않는다. 초안 보관용이다.
- `sort_order` 가 작을수록 위에 온다. 같으면 기간 역순으로 정렬된다.
- `projects.is_featured = true` 인 항목이 홈의 대표 프로젝트 3개에 먼저 들어간다.
- `key_decisions`, `highlights`, `interests`, `research_questions`, `tech_stack` 은 배열 컬럼이다. 대시보드에서는 `{"첫 항목","둘째 항목"}` 형식으로 입력한다.
- 긴 본문은 빈 줄로 문단을 나누면 화면에서도 문단이 나뉜다.
- 링크 컬럼(`github_url`, `blog_url`, `demo_url`, `pdf_url`)은 값이 있는 것만 표시된다.

### 4.3. PDF 올리기

`schema.sql` 이 `documents` 라는 공개 Storage 버킷을 만든다.

1. **Storage → documents** 에 PDF 를 올린다.
2. 파일의 공개 URL 을 복사한다.
3. `research_plans.pdf_url` 또는 `projects.pdf_url` 에 붙여넣는다.

> 공개 버킷이므로 URL 을 아는 사람은 누구나 받을 수 있다. 개인정보가 들어간 파일은 올리지 않는다.

수정한 내용은 최대 5분 뒤 사이트에 반영된다(`revalidate = 300`). 즉시 반영하려면 Netlify 에서 재배포한다.

---

## 5. Netlify 배포

### 5.1. 저장소 올리기

```bash
git remote add origin https://github.com/GITHUB_USERNAME/portfolio-site.git
```

```bash
git push -u origin main
```

### 5.2. Netlify 사이트 만들기

1. [app.netlify.com](https://app.netlify.com) → **Add new site → Import an existing project**
2. GitHub 저장소를 선택한다.
3. 빌드 설정은 `netlify.toml` 이 이미 정의하고 있으므로 그대로 둔다.
   - Build command: `npm run build`
   - Publish directory: `.next`
   - Node version: 22
   - Plugin: `@netlify/plugin-nextjs` (자동 설치)

### 5.3. 환경변수 등록

**Site configuration → Environment variables** 에서 세 개를 추가한다.
빌드 시점에 필요하므로 **Deploy 전에** 넣어야 한다.

| Key | Value |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Publishable / anon 키 |
| `NEXT_PUBLIC_SITE_URL` | 배포 주소 (예: `https://my-archive.netlify.app`) |

`NEXT_PUBLIC_SITE_URL` 은 첫 배포로 도메인을 받은 뒤 값을 채우고 한 번 더 배포한다.

### 5.4. 배포

**Deploys → Trigger deploy → Deploy site** 를 누른다.
빌드가 끝나면 `/`, `/cv`, `/work`, `/research`, `/contact` 를 차례로 열어 확인한다.

### 5.5. CLI 로 배포할 때

```bash
npx netlify-cli deploy --build --prod
```

---

## 6. 자주 걸리는 곳

| 증상 | 원인과 해결 |
| --- | --- |
| 모든 섹션이 "등록된 항목이 없다" | 환경변수 누락. Netlify 에 세 변수를 넣고 **재배포**한다. 변수만 저장하면 반영되지 않는다 |
| 일부 항목만 안 보임 | 해당 행의 `is_published` 가 `false` 다 |
| 수정했는데 그대로 | ISR 캐시. 최대 5분 기다리거나 Netlify 에서 재배포한다 |
| `/work/새-slug` 가 404 | `is_published = true` 인지, `slug` 에 공백이나 한글이 없는지 확인한다 |
| 빌드는 되는데 데이터가 안 옴 | RLS 정책 누락. `schema.sql` 의 5번 절을 다시 실행한다 |

---

## 7. 보안 메모

- 이 사이트에는 쓰기 경로가 없다. RLS 에 `select` 정책만 있으므로 anon 키로는 insert/update/delete 가 전부 거부된다.
- `service_role` 키는 어디에도 두지 않는다. 넣을 자리가 없다.
- `.env.local` 은 `.gitignore` 에 있다. 커밋되지 않는다.
- Storage `documents` 버킷은 공개다. 민감한 파일을 올리지 않는다.
