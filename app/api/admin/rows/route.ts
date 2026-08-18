import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE, verifyKey, verifyToken } from "@/lib/adminAuth";
import { findSpec, type FieldSpec } from "@/lib/adminSchema";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

// =====================================================================
// 관리자 쓰기 API.
//
// POST { action, table, profileId?, id?, row? }
//   - list   : 해당 테이블 전체(미공개 포함) 조회
//   - upsert : 생성 또는 수정. row 의 컬럼은 adminSchema 화이트리스트로 제한
//   - delete : id 로 삭제
//
// 모든 요청은 로그인 쿠키를 검증하고, service role 클라이언트로만 쓴다.
// =====================================================================

type Body = {
  action?: "list" | "upsert" | "delete";
  table?: string;
  profileId?: string;
  id?: string;
  row?: Record<string, unknown>;
  /** 인물 문서 삭제처럼 파급이 큰 동작에서 요구하는 인증키 재입력 값 */
  confirmKey?: string;
};

/**
 * slug 정규화. 사용자가 "/eunsj", " Eunsj ", "eun sj" 처럼 넣어도
 * URL 조각으로 쓸 수 있는 형태로 맞춘다.
 *   - 앞뒤 공백·슬래시 제거
 *   - 소문자
 *   - 공백·밑줄 → 하이픈, 허용 문자(a-z 0-9 - 한글) 외 제거, 연속 하이픈 축약
 * 한글 slug 도 허용한다 — Next 가 URL 인코딩을 처리하므로 /조은성 도 동작한다.
 */
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

/** 명세에 따라 값 하나를 DB 에 넣을 형태로 강제한다. */
function coerce(field: FieldSpec, value: unknown): unknown {
  // slug 컬럼은 타입과 무관하게 항상 정규화한다.
  if (field.key === "slug") {
    const s = normalizeSlug(String(value ?? ""));
    if (!s) throw new Error("URL 조각(slug)이 비어 있다. 영문·숫자·하이픈으로 적는다.");
    return s;
  }

  switch (field.type) {
    case "bool":
      return Boolean(value);
    case "int": {
      if (value === "" || value === null || value === undefined) return null;
      const n = Number(value);
      return Number.isFinite(n) ? Math.trunc(n) : null;
    }
    case "date": {
      const s = String(value ?? "").trim();
      return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
    }
    case "lines": {
      if (Array.isArray(value)) return value.map(String).filter((s) => s.trim());
      return String(value ?? "")
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean);
    }
    case "json": {
      if (typeof value === "object" && value !== null) return value;
      try {
        return JSON.parse(String(value ?? "[]"));
      } catch {
        throw new Error(`${field.label}: JSON 형식이 올바르지 않다.`);
      }
    }
    case "select": {
      const s = String(value ?? "").trim();
      if (field.options && !field.options.includes(s)) {
        throw new Error(`${field.label}: 허용되지 않는 값(${s}).`);
      }
      return s;
    }
    default: {
      const s = String(value ?? "").trim();
      // 링크·URL 계열 컬럼은 빈 문자열 대신 null 을 원하는 곳이 있다.
      // 스키마상 not null default '' 인 컬럼도 있어, 빈 값은 그대로 둔다.
      return s;
    }
  }
}

export async function POST(req: Request) {
  const jar = await cookies();
  if (!verifyToken(jar.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ error: "인증이 필요하다." }, { status: 401 });
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json({ error: "service role 키가 설정되지 않았다." }, { status: 500 });
  }

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "요청 본문이 JSON 이 아니다." }, { status: 400 });
  }

  const spec = findSpec(body.table ?? "");
  if (!spec) {
    return NextResponse.json({ error: `허용되지 않는 테이블: ${body.table}` }, { status: 400 });
  }
  const isProfileTable = spec.table === "people";

  try {
    /* ---------------- list ---------------- */
    if (body.action === "list") {
      let q = admin.from(spec.table).select("*");
      if (!isProfileTable) {
        if (!body.profileId) {
          return NextResponse.json({ error: "profileId 가 필요하다." }, { status: 400 });
        }
        q = q.eq("profile_id", body.profileId);
      }
      const { data, error } = await q.order("sort_order", { ascending: true });
      if (error) throw new Error(error.message);
      return NextResponse.json({ rows: data ?? [] });
    }

    /* ---------------- upsert ---------------- */
    if (body.action === "upsert") {
      const input = body.row ?? {};
      const clean: Record<string, unknown> = {};
      for (const field of spec.fields) {
        if (field.key in input) clean[field.key] = coerce(field, input[field.key]);
      }
      if (!isProfileTable) {
        if (!body.profileId) {
          return NextResponse.json({ error: "profileId 가 필요하다." }, { status: 400 });
        }
        clean.profile_id = body.profileId;
      }

      let result;
      if (body.id) {
        result = await admin.from(spec.table).update(clean).eq("id", body.id).select().single();
      } else {
        result = await admin.from(spec.table).insert(clean).select().single();
      }
      if (result.error) throw new Error(result.error.message);

      // 사이트 전체 캐시를 비워 수정이 즉시 보이게 한다.
      revalidatePath("/", "layout");
      return NextResponse.json({ row: result.data });
    }

    /* ---------------- delete ---------------- */
    if (body.action === "delete") {
      if (!body.id) {
        return NextResponse.json({ error: "id 가 필요하다." }, { status: 400 });
      }

      // 인물 문서 삭제는 딸린 콘텐츠까지 연쇄 삭제되는 되돌릴 수 없는
      // 동작이다. 세션 쿠키만으로는 부족하며 인증키를 그 자리에서 다시
      // 받는다. 화면이 아니라 서버에서 검사해야 API 직접 호출로도
      // 우회할 수 없다.
      if (isProfileTable && !verifyKey(body.confirmKey ?? "")) {
        return NextResponse.json(
          { error: "문서 삭제에는 인증키 재입력이 필요하다." },
          { status: 403 },
        );
      }

      const { error } = await admin.from(spec.table).delete().eq("id", body.id);
      if (error) throw new Error(error.message);

      revalidatePath("/", "layout");
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: `알 수 없는 action: ${body.action}` }, { status: 400 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "알 수 없는 오류";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
