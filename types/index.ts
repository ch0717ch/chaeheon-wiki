// Supabase 테이블 행과 1:1로 대응하는 타입. schema.sql 을 고치면 여기도 같이 고친다.

/** 전문 분야 한 영역. profiles.expertise jsonb 의 원소. */
export type ExpertiseArea = {
  title: string;
  summary: string;
  skills: string[];
};

/** 인물 문서 하나. 나무위키의 문서에 해당한다. */
export type Profile = {
  id: string;
  slug: string;
  name: string;
  name_en: string;
  title: string;
  intro: string;
  field_main: string;
  field_sub: string;
  keywords: string[];
  mbti: string;
  birth_date: string;
  location: string;
  languages: string;
  photo_url: string;
  resume_pdf_url: string;
  /** 문서 배경음악. 비어 있으면 재생 버튼을 숨긴다. */
  music_url: string;
  music_title: string;
  link_github: string;
  link_blog: string;
  link_blog2: string;
  link_instagram: string;
  link_email: string;
  link_linkedin: string;
  education_summary: string[];
  expertise: ExpertiseArea[];
  target_primary: string;
  target_secondary: string;
  target_edge: string;
  sort_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

export type Project = {
  id: string;
  profile_id: string | null;
  slug: string;
  title: string;
  summary: string;
  category: string | null;
  problem: string;
  role: string;
  key_decisions: string[];
  outcome: string;
  /** 섹션 이름 덮어쓰기. 비우면 기본(문제/역할/핵심 판단/결과)이 쓰인다. */
  label_problem: string;
  label_role: string;
  label_decisions: string;
  label_outcome: string;
  tech_stack: string[];
  period_start: string | null;
  period_end: string | null;
  is_ongoing: boolean;
  github_url: string | null;
  blog_url: string | null;
  demo_url: string | null;
  pdf_url: string | null;
  is_featured: boolean;
  sort_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

export type Experience = {
  id: string;
  profile_id: string | null;
  org: string;
  title: string;
  employment_type: string | null;
  location: string | null;
  period_start: string;
  period_end: string | null;
  is_current: boolean;
  description: string;
  highlights: string[];
  /** 인턴 일지 등 이 경력을 증빙하는 포트폴리오 PDF. 비우면 링크가 숨겨진다. */
  pdf_url: string;
  sort_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

export type Education = {
  id: string;
  profile_id: string | null;
  /** 기관명을 밝히지 않는 학력은 null. 이때는 전공이 제목 자리를 대신한다. */
  school: string | null;
  degree: string | null;
  field: string | null;
  location: string | null;
  period_start: string | null;
  period_end: string | null;
  is_current: boolean;
  note: string;
  sort_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

export type CertificationKind = "certificate" | "license" | "course" | "award";

export type Certification = {
  id: string;
  profile_id: string | null;
  name: string;
  issuer: string | null;
  kind: CertificationKind;
  issued_on: string | null;
  note: string;
  sort_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

export type TimelineEntry = {
  id: string;
  profile_id: string | null;
  year: number;
  month: number | null;
  end_year: number | null;
  title: string;
  category: string;
  note: string;
  sort_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

export type ResearchPlanStatus = "draft" | "in_progress" | "submitted" | "published";

export type ResearchPlan = {
  id: string;
  profile_id: string | null;
  slug: string;
  title: string;
  abstract: string;
  interests: string[];
  research_questions: string[];
  methodology: string;
  status: ResearchPlanStatus;
  pdf_url: string | null;
  reference_urls: string[];
  sort_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};
