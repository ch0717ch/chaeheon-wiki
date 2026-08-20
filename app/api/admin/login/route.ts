import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  SESSION_MAX_AGE,
  docCookieName,
  isConfigured,
  makeDocToken,
  makeToken,
  verifyDocPassword,
  verifyDocToken,
  verifyKey,
  verifyToken,
} from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

// =====================================================================
// 로그인.
//
// POST { key, person? }
//   - key 가 마스터 인증키와 일치 → 전체 권한 세션 (모든 문서)
//   - person(slug) 이 주어지고 key 가 그 문서의 비밀번호와 일치
//     → 그 문서에만 유효한 세션 (열람 + 자기 문서 수정)
//
// GET  { master, doc } 현재 세션 상태. person 쿼리로 문서 세션 확인.
// DELETE               모든 세션 해제.
// =====================================================================

const attempts = new Map<string, { n: number; ts: number }>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_TRIES = 10;

function clientIp(req: Request): string {
  return (
    req.headers.get("x-nf-client-connection-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    "unknown"
  );
}

const cookieOpts = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_MAX_AGE,
};

export async function GET(req: Request) {
  const jar = await cookies();
  const master = verifyToken(jar.get(ADMIN_COOKIE)?.value);

  // person 쿼리가 있으면 그 문서의 세션도 확인해 준다.
  const url = new URL(req.url);
  const person = url.searchParams.get("person");
  let doc: { id: string; slug: string } | null = null;
  if (person) {
    const admin = getSupabaseAdmin();
    if (admin) {
      const { data } = await admin
        .from("people")
        .select("id, slug, edit_password_hash, is_protected")
        .eq("slug", person)
        .maybeSingle();
      if (data) {
        const hasSession = verifyDocToken(jar.get(docCookieName(data.id))?.value, data.id);
        // 비밀번호도 보호도 없는 열린 문서는 세션 없이도 편집 자격이 있다.
        const open = !data.is_protected && !data.edit_password_hash;
        if (hasSession || open) doc = { id: data.id, slug: data.slug };
      }
    }
  }

  return NextResponse.json({ authed: master, master, doc, configured: isConfigured() });
}

export async function POST(req: Request) {
  if (!isConfigured()) {
    return NextResponse.json({ error: "서버 설정이 비어 있다." }, { status: 500 });
  }

  const ip = clientIp(req);
  const now = Date.now();
  const rec = attempts.get(ip);
  if (rec && now - rec.ts < WINDOW_MS && rec.n >= MAX_TRIES) {
    return NextResponse.json({ error: "시도 횟수를 초과했다. 잠시 후 다시." }, { status: 429 });
  }
  await new Promise((r) => setTimeout(r, 400));

  let key = "";
  let person = "";
  try {
    const body = await req.json();
    key = typeof body?.key === "string" ? body.key : "";
    person = typeof body?.person === "string" ? body.person : "";
  } catch {
    /* 아래에서 거른다 */
  }

  const fail = () => {
    const cur = rec && now - rec.ts < WINDOW_MS ? rec : { n: 0, ts: now };
    attempts.set(ip, { n: cur.n + 1, ts: cur.ts });
    return NextResponse.json(
      { error: "비밀번호가 올바르지 않다." },
      { status: 401 },
    );
  };

  if (!key) return fail();

  // 1) 마스터 키 — 모든 문서
  if (verifyKey(key)) {
    attempts.delete(ip);
    const res = NextResponse.json({ ok: true, scope: "master" });
    res.cookies.set(ADMIN_COOKIE, makeToken(), cookieOpts);
    return res;
  }

  // 2) 문서 비밀번호 — 해당 문서만
  if (person) {
    const admin = getSupabaseAdmin();
    if (!admin) return fail();
    const { data } = await admin
      .from("people")
      .select("id, slug, edit_password_hash")
      .eq("slug", person)
      .maybeSingle();
    if (data?.edit_password_hash && verifyDocPassword(key, data.edit_password_hash)) {
      attempts.delete(ip);
      const res = NextResponse.json({
        ok: true,
        scope: "doc",
        doc: { id: data.id, slug: data.slug },
      });
      res.cookies.set(docCookieName(data.id), makeDocToken(data.id), cookieOpts);
      return res;
    }
  }

  return fail();
}

export async function DELETE() {
  const jar = await cookies();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, "", { path: "/", maxAge: 0 });
  // 문서 쿠키도 전부 지운다.
  for (const c of jar.getAll()) {
    if (c.name.startsWith("cw_doc_")) res.cookies.set(c.name, "", { path: "/", maxAge: 0 });
  }
  return res;
}
