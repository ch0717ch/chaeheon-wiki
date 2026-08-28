import "server-only";
// node: 접두사는 과거 배포 환경에서 문제를 일으킨 적이 있어 쓰지 않는다.
import { createHmac, createHash, randomBytes, timingSafeEqual } from "crypto";

// =====================================================================
// 인증키 기반 관리자 세션.
//
// 흐름: /api/admin/login 에 키 제출 → 서버가 ADMIN_KEY 와 비교 →
// 성공 시 만료시각을 HMAC 서명한 토큰을 httpOnly 쿠키로 발급.
// 이후 쓰기 API 는 쿠키의 서명만 검증한다. 키 자체는 어디에도 저장하지 않는다.
// =====================================================================

export const ADMIN_COOKIE = "cw_admin";
const SESSION_HOURS = 12;

function secret(): string | null {
  return process.env.ADMIN_KEY || null;
}

export function isConfigured(): boolean {
  return Boolean(secret() && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

/** 길이가 달라도 시간이 새지 않도록 해시로 정규화한 뒤 비교한다. */
export function verifyKey(input: string): boolean {
  const s = secret();
  if (!s) return false;
  const a = createHash("sha256").update(input).digest();
  const b = createHash("sha256").update(s).digest();
  return timingSafeEqual(a, b);
}

function sign(payload: string): string {
  const s = secret();
  if (!s) return "";
  return createHmac("sha256", `cw-admin:${s}`).update(payload).digest("hex");
}

/** "만료시각.서명" 형태의 세션 토큰. */
export function makeToken(): string {
  const exp = Date.now() + SESSION_HOURS * 3600 * 1000;
  return `${exp}.${sign(String(exp))}`;
}

export function verifyToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const dot = token.indexOf(".");
  if (dot <= 0) return false;
  const exp = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (!/^\d+$/.test(exp) || Number(exp) < Date.now()) return false;
  const expect = sign(exp);
  if (!expect || expect.length !== sig.length) return false;
  return timingSafeEqual(Buffer.from(expect), Buffer.from(sig));
}

export const SESSION_MAX_AGE = SESSION_HOURS * 3600;

/* =====================================================================
   문서 단위 인증.

   문서마다 비밀번호(해시 저장)가 있고, 맞으면 그 문서에만 유효한
   쿠키를 발급한다. 마스터 키 세션과 별개로 동작한다.
   ===================================================================== */

/** 문서 비밀번호 해시. "salt$hash" 형태로 저장한다. */
export function hashDocPassword(password: string): string {
  const salt = randomBytes(8).toString("hex");
  const hash = createHash("sha256").update(`${salt}:${password}`).digest("hex");
  return `${salt}$${hash}`;
}

export function verifyDocPassword(password: string, stored: string): boolean {
  const dollar = stored.indexOf("$");
  if (dollar <= 0) return false;
  const salt = stored.slice(0, dollar);
  const expect = stored.slice(dollar + 1);
  const got = createHash("sha256").update(`${salt}:${password}`).digest("hex");
  if (got.length !== expect.length) return false;
  return timingSafeEqual(Buffer.from(got), Buffer.from(expect));
}

/** 문서 쿠키 이름. 문서 여러 개를 동시에 열어도 서로 덮어쓰지 않는다. */
export function docCookieName(docId: string): string {
  return `cw_doc_${docId.replace(/-/g, "").slice(0, 12)}`;
}

/** 문서 id 를 서명에 포함해, 다른 문서의 토큰을 재사용할 수 없게 한다. */
export function makeDocToken(docId: string): string {
  const exp = Date.now() + SESSION_HOURS * 3600 * 1000;
  return `${exp}.${sign(`doc:${docId}:${exp}`)}`;
}

export function verifyDocToken(token: string | undefined | null, docId: string): boolean {
  if (!token) return false;
  const dot = token.indexOf(".");
  if (dot <= 0) return false;
  const exp = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (!/^\d+$/.test(exp) || Number(exp) < Date.now()) return false;
  const expect = sign(`doc:${docId}:${exp}`);
  if (!expect || expect.length !== sig.length) return false;
  return timingSafeEqual(Buffer.from(expect), Buffer.from(sig));
}
