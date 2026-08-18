import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  SESSION_MAX_AGE,
  isConfigured,
  makeToken,
  verifyKey,
  verifyToken,
} from "@/lib/adminAuth";

export const runtime = "nodejs";

// 서버리스 인스턴스 단위의 임시 시도 제한. 완전하지는 않지만
// 무차별 대입의 속도를 크게 늦춘다.
const attempts = new Map<string, { n: number; ts: number }>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_TRIES = 8;

function clientIp(req: Request): string {
  return (
    req.headers.get("x-nf-client-connection-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    "unknown"
  );
}

/** 현재 세션 상태 확인 */
export async function GET() {
  const jar = await cookies();
  const authed = verifyToken(jar.get(ADMIN_COOKIE)?.value);
  return NextResponse.json({ authed, configured: isConfigured() });
}

/** 인증키 제출 → 세션 쿠키 발급 */
export async function POST(req: Request) {
  if (!isConfigured()) {
    return NextResponse.json(
      { error: "서버에 ADMIN_KEY 또는 service role 키가 설정되지 않았다." },
      { status: 500 },
    );
  }

  const ip = clientIp(req);
  const now = Date.now();
  const rec = attempts.get(ip);
  if (rec && now - rec.ts < WINDOW_MS && rec.n >= MAX_TRIES) {
    return NextResponse.json(
      { error: "시도 횟수를 초과했다. 잠시 후 다시." },
      { status: 429 },
    );
  }

  // 응답 시간으로 키를 유추하지 못하도록 항상 일정 시간을 소모한다.
  await new Promise((r) => setTimeout(r, 400));

  let key = "";
  try {
    const body = await req.json();
    key = typeof body?.key === "string" ? body.key : "";
  } catch {
    /* 빈 키로 처리 */
  }

  if (!key || !verifyKey(key)) {
    const cur = rec && now - rec.ts < WINDOW_MS ? rec : { n: 0, ts: now };
    attempts.set(ip, { n: cur.n + 1, ts: cur.ts });
    return NextResponse.json({ error: "인증키가 올바르지 않다." }, { status: 401 });
  }

  attempts.delete(ip);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, makeToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return res;
}

/** 로그아웃 */
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
