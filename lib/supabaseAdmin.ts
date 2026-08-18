import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// 쓰기 전용 관리 클라이언트. service role 키는 RLS 를 우회하므로
// 이 모듈은 절대 클라이언트 코드에서 import 하면 안 된다.
// 위의 "server-only" 선언이 실수로 섞이면 빌드를 실패시킨다.

let cached: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;

  if (!cached) {
    cached = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return cached;
}
