import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// 이 사이트는 공개 읽기 전용이라 로그인도 쿠키 세션도 없다.
// 그래서 @supabase/ssr 없이 anon 키만 쓰는 단일 클라이언트로 충분하다.
// 쓰기는 RLS 에서 전부 막혀 있으므로 이 키가 번들에 들어가도 문제가 없다.

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 환경변수가 비어 있어도 빌드가 죽지 않게 한다.
// 첫 배포처럼 아직 키를 넣지 않은 상태에서도 페이지는 떠야 한다.
export const hasSupabaseEnv = Boolean(url && anonKey);

let cached: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!hasSupabaseEnv) return null;
  if (!cached) {
    cached = createClient(url!, anonKey!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return cached;
}
