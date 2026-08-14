import { getSupabase } from "@/lib/supabase";
import type {
  Certification,
  Education,
  Experience,
  Project,
  ResearchPlan,
  TimelineEntry,
} from "@/types";

// 모든 조회는 실패해도 예외를 던지지 않고 빈 배열을 돌려준다.
// 환경변수 누락이나 일시적인 네트워크 오류로 사이트 전체가 500 이 되는 것보다
// 해당 섹션만 "아직 등록된 항목이 없다"로 비는 편이 낫다.

function logFailure(scope: string, error: unknown) {
  if (error) console.error(`[queries] ${scope} 조회 실패:`, error);
}

export async function getProjects(): Promise<Project[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("is_published", true)
    .order("sort_order", { ascending: true })
    .order("period_start", { ascending: false, nullsFirst: false });

  logFailure("projects", error);
  return (data as Project[]) ?? [];
}

/** 홈에 노출할 대표 프로젝트. is_featured 가 부족하면 상위 항목으로 채운다. */
export async function getFeaturedProjects(limit = 3): Promise<Project[]> {
  const projects = await getProjects();
  const featured = projects.filter((p) => p.is_featured);
  const rest = projects.filter((p) => !p.is_featured);
  return [...featured, ...rest].slice(0, limit);
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  logFailure(`project(${slug})`, error);
  return (data as Project) ?? null;
}

export async function getExperiences(): Promise<Experience[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("experiences")
    .select("*")
    .eq("is_published", true)
    .order("sort_order", { ascending: true })
    .order("period_start", { ascending: false });

  logFailure("experiences", error);
  return (data as Experience[]) ?? [];
}

export async function getEducation(): Promise<Education[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("education")
    .select("*")
    .eq("is_published", true)
    .order("sort_order", { ascending: true })
    .order("period_start", { ascending: false, nullsFirst: false });

  logFailure("education", error);
  return (data as Education[]) ?? [];
}

export async function getCertifications(): Promise<Certification[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("certifications")
    .select("*")
    .eq("is_published", true)
    .order("sort_order", { ascending: true })
    .order("issued_on", { ascending: false, nullsFirst: false });

  logFailure("certifications", error);
  return (data as Certification[]) ?? [];
}

export async function getTimeline(): Promise<TimelineEntry[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("timeline")
    .select("*")
    .eq("is_published", true)
    .order("year", { ascending: false })
    .order("month", { ascending: false, nullsFirst: false });

  logFailure("timeline", error);
  return (data as TimelineEntry[]) ?? [];
}

export async function getResearchPlans(): Promise<ResearchPlan[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("research_plans")
    .select("*")
    .eq("is_published", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  logFailure("research_plans", error);
  return (data as ResearchPlan[]) ?? [];
}
