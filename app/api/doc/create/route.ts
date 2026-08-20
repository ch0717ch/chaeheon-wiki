import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import {
  SESSION_MAX_AGE,
  docCookieName,
  hashDocPassword,
  makeDocToken,
} from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

// =====================================================================
// 공개 문서 생성 — 인증키 없이 누구나.
//
// POST { name, slug?, password, viewLocked? }
//   - password 는 필수(4자 이상). 이 비밀번호로 본인 문서를 수정하고,
//     viewLocked 를 켰다면 열람할 때도 쓴다.
//   - 성공 시 해당 문서의 편집 세션 쿠키를 바로 발급한다.
//
// 스팸 방지: IP 당 1시간에 3개까지.
// =====================================================================

const created = new Map<string, { n: number; ts: number }>();
const WINDOW_MS = 60 * 60 * 1000;
const MAX_CREATE = 3;

function clientIp(req: Request): string {
  return (
    req.headers.get("x-nf-client-connection-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    "unknown"
  );
}

function normalizeSlug(raw: string): string {
  return raw
    .trim()
    .replace(/^\/+|\/+$/g, "")
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9\-ㄱ-ㆎ가-힣]/g, "")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function POST(req: Request) {
  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json({ error: "서버 설정이 비어 있다." }, { status: 500 });
  }

  const ip = clientIp(req);
  const now = Date.now();
  const rec = created.get(ip);
  if (rec && now - rec.ts < WINDOW_MS && rec.n >= MAX_CREATE) {
    return NextResponse.json(
      { error: "문서 생성이 너무 잦다. 1시간 뒤에 다시." },
      { status: 429 },
    );
  }

  let name = "";
  let slugRaw = "";
  let password = "";
  let viewLocked = false;
  try {
    const body = await req.json();
    name = typeof body?.name === "string" ? body.name.trim() : "";
    slugRaw = typeof body?.slug === "string" ? body.slug : "";
    password = typeof body?.password === "string" ? body.password : "";
    viewLocked = Boolean(body?.viewLocked);
  } catch {
    /* 아래에서 거른다 */
  }

  if (!name) return NextResponse.json({ error: "이름을 입력한다." }, { status: 400 });
  // 비밀번호는 권장이지만 강제하지 않는다. 없으면 누구나 수정할 수 있는
  // 열린 문서가 된다 (생성 화면에 빨간 경고로 고지).
  if (password && password.length < 4) {
    return NextResponse.json(
      { error: "문서 비밀번호는 4자 이상이어야 한다." },
      { status: 400 },
    );
  }
  if (viewLocked && !password) {
    return NextResponse.json(
      { error: "문서 잠금은 비밀번호가 있어야 켤 수 있다." },
      { status: 400 },
    );
  }

  const slug = normalizeSlug(slugRaw || name);
  if (!slug) {
    return NextResponse.json({ error: "URL 조각(slug)을 만들 수 없다." }, { status: 400 });
  }
  // 예약된 경로와 충돌 금지
  if (["admin", "api", "docs", "images", "robots.txt", "sitemap.xml"].includes(slug)) {
    return NextResponse.json({ error: "쓸 수 없는 URL 조각이다." }, { status: 400 });
  }

  const { data: dup } = await admin.from("people").select("id").eq("slug", slug).maybeSingle();
  if (dup) {
    return NextResponse.json({ error: `/${slug} 는 이미 있는 문서다.` }, { status: 409 });
  }

  const { data, error } = await admin
    .from("people")
    .insert({
      slug,
      name,
      edit_password_hash: password ? hashDocPassword(password) : "",
      view_locked: viewLocked,
      sort_order: 100,
    })
    .select("id, slug, name")
    .single();
  if (error || !data) {
    return NextResponse.json({ error: `생성 실패: ${error?.message}` }, { status: 500 });
  }

  const cur = rec && now - rec.ts < WINDOW_MS ? rec : { n: 0, ts: now };
  created.set(ip, { n: cur.n + 1, ts: cur.ts });

  revalidatePath("/", "layout");

  const res = NextResponse.json({ ok: true, doc: data });
  res.cookies.set(docCookieName(data.id), makeDocToken(data.id), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return res;
}
