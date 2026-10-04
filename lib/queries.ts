import { cache } from "react";
import { getSupabase } from "@/lib/supabase";
import type {
  Certification,
  Education,
  Experience,
  ExpertiseArea,
  ExtraLink,
  Profile,
  Project,
  ResearchPlan,
  TimelineEntry,
} from "@/types";

// 모든 조회는 실패해도 예외를 던지지 않고 빈 값을 돌려준다.
// 환경변수 누락이나 일시적인 네트워크 오류로 사이트 전체가 500 이 되는 것보다
// 해당 섹션만 비는 편이 낫다.

function logFailure(scope: string, error: unknown) {
  if (error) console.error(`[queries] ${scope} 조회 실패:`, error);
}

// App Router 의 동적 세그먼트 값은 퍼센트 인코딩된 채로 넘어온다.
// 한글 slug(/홍길동 → %ED%99%8D...)를 그대로 DB 에 조회하면 항상 404 가
// 나므로, slug 로 찾기 전에 반드시 디코딩한다. NFC 정규화는 iOS 등에서
// 자소 분리된 한글이 들어오는 경우를 흡수한다.
function decodeSlug(raw: string): string {
  try {
    return decodeURIComponent(raw).normalize("NFC");
  } catch {
    return raw;
  }
}

/* ---------------------------------------------------------------------
   사람이 직접 적는 값 다듬기

   expertise·links_extra 는 관리 화면에서 JSON 을 손으로 적는 칸이고,
   목록 칸도 구버전 행에서는 null 로 남아 있다. 모양이 어긋난 값 하나가
   렌더 도중 예외가 되면 그 문서만 통째로 500 이 되므로(화면은 배열과
   문자열을 가정한다), 읽어 들이는 길목에서 한 번 맞춰 둔다.
   살릴 수 있는 값은 살리고, 쓸 수 없는 원소만 버린다.
   --------------------------------------------------------------------- */
function asText(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}

function asTextList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(asText).filter((s) => s.trim());
  const one = asText(value).trim();
  return one ? [one] : [];
}

function asExpertise(value: unknown): ExpertiseArea[] {
  if (value === null || value === undefined) return [];
  const rows = Array.isArray(value) ? value : [value];
  return rows
    .map((row) => {
      // ["작곡", "편곡"] 처럼 제목만 늘어놓은 경우도 영역으로 받아 준다.
      if (!row || typeof row !== "object" || Array.isArray(row)) {
        const title = asText(row).trim();
        return title ? { title, summary: "", skills: [] } : null;
      }
      const r = row as Record<string, unknown>;
      const area: ExpertiseArea = {
        title: asText(r.title).trim(),
        summary: asText(r.summary).trim(),
        skills: asTextList(r.skills),
      };
      return area.title || area.summary || area.skills.length ? area : null;
    })
    .filter((a): a is ExpertiseArea => a !== null);
}

function asExtraLinks(value: unknown): ExtraLink[] {
  if (value === null || value === undefined) return [];
  const rows = Array.isArray(value) ? value : [value];
  return rows
    .map((row) => {
      if (!row || typeof row !== "object" || Array.isArray(row)) return null;
      const r = row as Record<string, unknown>;
      const url = asText(r.url).trim();
      if (!url) return null; // 주소가 없으면 걸 데가 없다
      const link: ExtraLink = {
        label: asText(r.label).trim() || url,
        url,
        note: asText(r.note).trim(),
      };
      return link;
    })
    .filter((l): l is ExtraLink => l !== null);
}

/** DB 행 하나를 화면이 기대하는 모양으로 맞춘다. */
function normalizeProfile(row: Profile): Profile {
  return {
    ...row,
    keywords: asTextList(row.keywords),
    languages: asText(row.languages),
    education_summary: asTextList(row.education_summary),
    expertise: asExpertise(row.expertise),
    links_extra: asExtraLinks(row.links_extra),
    view_locked: row.view_locked ?? false,
    is_protected: row.is_protected ?? false,
  };
}

/* ---------------------------------------------------------------------
   profiles — 인물 문서

   비밀번호 해시 컬럼은 DB 에서 anon 의 열람 권한을 회수했다.
   그래서 select("*") 는 실패하며, 반드시 컬럼을 명시해서 읽는다.
   --------------------------------------------------------------------- */
const PEOPLE_COLUMNS = [
  "id", "slug", "name", "name_en", "title", "intro",
  "field_main", "field_sub", "keywords", "mbti", "birth_date",
  "location", "languages", "photo_url", "resume_pdf_url",
  "music_url", "music_title",
  "link_github", "link_blog", "link_blog2", "link_instagram",
  "link_email", "link_linkedin", "links_extra",
  "education_summary", "expertise",
  "target_primary", "target_secondary", "target_edge",
  "view_locked", "is_protected", "sort_order", "is_published", "created_at", "updated_at",
].join(",");

// 구버전 DB(v7 이전: view_locked 없음 / v9 이전: links_extra 없음)에서도
// 동작하도록 한 번 물러선다.
const PEOPLE_COLUMNS_LEGACY = PEOPLE_COLUMNS.replace(",view_locked", "")
  .replace(",is_protected", "")
  .replace(",links_extra", "");

export async function getProfiles(): Promise<Profile[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const first = await supabase
    .from("people")
    .select(PEOPLE_COLUMNS)
    .eq("is_published", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (!first.error)
    return ((first.data as unknown as Profile[]) ?? []).map(normalizeProfile);

  const legacy = await supabase
    .from("people")
    .select(PEOPLE_COLUMNS_LEGACY)
    .eq("is_published", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  logFailure("people", legacy.error);
  const rows = (legacy.data as unknown as Profile[]) ?? [];
  return rows.map(normalizeProfile);
}

// 레이아웃과 페이지가 같은 요청 안에서 두 번 부르므로 React cache 로 감싼다.
export const getProfileBySlug = cache(async (rawSlug: string): Promise<Profile | null> => {
  const supabase = getSupabase();
  if (!supabase) return null;
  const slug = decodeSlug(rawSlug);

  const first = await supabase
    .from("people")
    .select(PEOPLE_COLUMNS)
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (!first.error) {
    const row = (first.data as unknown as Profile) ?? null;
    return row ? normalizeProfile(row) : null;
  }

  const legacy = await supabase
    .from("people")
    .select(PEOPLE_COLUMNS_LEGACY)
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  logFailure(`profile(${slug})`, legacy.error);
  const row = (legacy.data as unknown as Profile) ?? null;
  return row ? normalizeProfile(row) : null;
});

/* ---------------------------------------------------------------------
   인물별 콘텐츠
   --------------------------------------------------------------------- */
export async function getProjects(profileId: string): Promise<Project[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("profile_id", profileId)
    .eq("is_published", true)
    .order("sort_order", { ascending: true })
    .order("period_start", { ascending: false, nullsFirst: false });

  logFailure("projects", error);
  return (data as Project[]) ?? [];
}

/** 대표 프로젝트. is_featured 가 부족하면 상위 항목으로 채운다. */
export async function getFeaturedProjects(profileId: string, limit = 3): Promise<Project[]> {
  const projects = await getProjects(profileId);
  const featured = projects.filter((p) => p.is_featured);
  const rest = projects.filter((p) => !p.is_featured);
  return [...featured, ...rest].slice(0, limit);
}

export async function getProjectBySlug(
  profileId: string,
  rawSlug: string,
): Promise<Project | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const slug = decodeSlug(rawSlug);

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("profile_id", profileId)
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  logFailure(`project(${slug})`, error);
  return (data as Project) ?? null;
}

export async function getExperiences(profileId: string): Promise<Experience[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("experiences")
    .select("*")
    .eq("profile_id", profileId)
    .eq("is_published", true)
    .order("sort_order", { ascending: true })
    .order("period_start", { ascending: false });

  logFailure("experiences", error);
  return (data as Experience[]) ?? [];
}

export async function getEducation(profileId: string): Promise<Education[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("education")
    .select("*")
    .eq("profile_id", profileId)
    .eq("is_published", true)
    .order("sort_order", { ascending: true })
    .order("period_start", { ascending: false, nullsFirst: false });

  logFailure("education", error);
  return (data as Education[]) ?? [];
}

export async function getCertifications(profileId: string): Promise<Certification[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("certifications")
    .select("*")
    .eq("profile_id", profileId)
    .eq("is_published", true)
    .order("sort_order", { ascending: true })
    .order("issued_on", { ascending: false, nullsFirst: false });

  logFailure("certifications", error);
  return (data as Certification[]) ?? [];
}

export async function getTimeline(profileId: string): Promise<TimelineEntry[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("timeline")
    .select("*")
    .eq("profile_id", profileId)
    .eq("is_published", true)
    .order("year", { ascending: false })
    .order("month", { ascending: false, nullsFirst: false })
    // 같은 해·같은 달 안의 순서는 sort_order 로 정한다.
    // 이게 없으면 순서가 DB 가 돌려주는 대로라 매번 달라질 수 있다.
    .order("sort_order", { ascending: true });

  logFailure("timeline", error);
  return (data as TimelineEntry[]) ?? [];
}

export async function getResearchPlans(profileId: string): Promise<ResearchPlan[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("research_plans")
    .select("*")
    .eq("profile_id", profileId)
    .eq("is_published", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  logFailure("research_plans", error);
  return (data as ResearchPlan[]) ?? [];
}
