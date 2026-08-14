// Supabase 테이블 행과 1:1로 대응하는 타입. schema.sql 을 고치면 여기도 같이 고친다.

export type Project = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  category: string | null;
  problem: string;
  role: string;
  key_decisions: string[];
  outcome: string;
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
  org: string;
  title: string;
  employment_type: string | null;
  location: string | null;
  period_start: string;
  period_end: string | null;
  is_current: boolean;
  description: string;
  highlights: string[];
  sort_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

export type Education = {
  id: string;
  school: string;
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

export type ResearchPlanStatus = "draft" | "in_progress" | "submitted" | "published";

export type ResearchPlan = {
  id: string;
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
