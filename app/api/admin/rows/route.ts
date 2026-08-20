import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  docCookieName,
  hashDocPassword,
  verifyDocToken,
  verifyKey,
  verifyToken,
} from "@/lib/adminAuth";
import { findSpec, type FieldSpec } from "@/lib/adminSchema";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

// =====================================================================
// 관리자 쓰기 API — 두 가지 권한.
//
//   master : 인증키 세션. 모든 문서의 모든 동작.
//   doc    : 문서 비밀번호 세션. 자기 문서(people 1행 + 딸린 콘텐츠)만
//            읽고 쓴다. 문서 삭제는 못 한다.
//
// POST { action, table, profileId?, id?, row?, confirmKey? }
// =====================================================================

type Body = {
  action?: "list" | "upsert" | "delete";
  table?: string;
  profileId?: string;
  id?: string;
  row?: Record<string, unknown>;
  confirmKey?: string;
};

/**
 * people 행에서 해시는 절대 내보내지 않는다.
 * 대신 "비밀번호가 설정돼 있는가"만 불리언으로 알려 화면이 상태를 보여줄 수 있게 한다.
 */
function stripSecret<T extends Record<string, unknown>>(row: T): T {
  const copy = { ...row } as Record<string, unknown>;
  copy.has_password = Boolean(copy.edit_password_hash);
  delete copy.edit_password_hash;
  return copy as T;
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

/** 명세에 따라 값 하나를 DB 에 넣을 형태로 강제한다. */
function coerce(field: FieldSpec, value: unknown): unknown {
  if (field.key === "slug") {
    const s = normalizeSlug(String(value ?? ""));
    if (!s) throw new Error("URL 조각(slug)이 비어 있다. 영문·숫자·하이픈으로 적는다.");
    return s;
  }

  switch (field.type) {
    case "textarea": {
      return String(value ?? "")
        .replace(/\r\n/g, "\n")
        .replace(/\\n/g, "\n")
        .trim();
    }
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
    default:
      return String(value ?? "").trim();
  }
}

export async function POST(req: Request) {
  const jar = await cookies();
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

  // ---------- 권한 스코프 판별 ----------
  const isMaster = verifyToken(jar.get(ADMIN_COOKIE)?.value);
  let docId: string | null = null;
  if (!isMaster) {
    // 문서 세션: profileId(콘텐츠) 또는 id(people 자기 행) 기준으로 확인한다.
    // people 목록 조회는 id 가 없으므로 profileId 로도 받아 준다.
    const candidate =
      body.table === "people"
        ? (body.id ?? body.profileId ?? "")
        : (body.profileId ?? "");
    if (candidate && verifyDocToken(jar.get(docCookieName(candidate))?.value, candidate)) {
      docId = candidate;
    } else if (candidate) {
      // 열린 문서: 비밀번호도 없고 보호 문서도 아니면 누구나 편집한다.
      // (생성 화면에서 빨간 경고로 고지하는 정책과 한 몸이다)
      const { data: doc } = await admin
        .from("people")
        .select("edit_password_hash, is_protected")
        .eq("id", candidate)
        .maybeSingle();
      if (doc && !doc.is_protected && !doc.edit_password_hash) {
        docId = candidate;
      }
    }
  }
  if (!isMaster && !docId) {
    return NextResponse.json({ error: "인증이 필요하다." }, { status: 401 });
  }

  const spec = findSpec(body.table ?? "");
  if (!spec) {
    return NextResponse.json({ error: `허용되지 않는 테이블: ${body.table}` }, { status: 400 });
  }
  const isProfileTable = spec.table === "people";

  try {
    /* ---------------- list ---------------- */
    if (body.action === "list") {
      if (isProfileTable) {
        let q = admin.from(spec.table).select("*");
        // 문서 세션은 자기 행만 본다.
        if (!isMaster) q = q.eq("id", docId!);
        const { data, error } = await q.order("sort_order", { ascending: true });
        if (error) throw new Error(error.message);
        return NextResponse.json({
          rows: (data ?? []).map((r) => stripSecret(r as Record<string, unknown>)),
        });
      }

      if (!body.profileId) {
        return NextResponse.json({ error: "profileId 가 필요하다." }, { status: 400 });
      }
      if (!isMaster && body.profileId !== docId) {
        return NextResponse.json({ error: "이 문서에 대한 권한이 없다." }, { status: 403 });
      }
      const { data, error } = await admin
        .from(spec.table)
        .select("*")
        .eq("profile_id", body.profileId)
        .order("sort_order", { ascending: true });
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

      if (isProfileTable) {
        // 문서 비밀번호 변경: new_password 는 컬럼이 아니라 특수 입력이다.
        const np = String((input as Record<string, unknown>).new_password ?? "");
        delete clean.new_password;
        if (np) {
          if (np.length < 4) throw new Error("문서 비밀번호는 4자 이상이어야 한다.");
          clean.edit_password_hash = hashDocPassword(np);
        }

        // 보호 문서 지정은 마스터만 바꿀 수 있다.
        if (!isMaster) delete clean.is_protected;

        // 잠금은 비밀번호가 있어야 켤 수 있다 — 아니면 아무도 못 여는 문서가 된다.
        if (clean.view_locked === true && !np && body.id) {
          const { data: cur } = await admin
            .from("people")
            .select("edit_password_hash")
            .eq("id", body.id)
            .maybeSingle();
          if (!cur?.edit_password_hash) {
            throw new Error("문서 잠금은 비밀번호를 먼저 설정해야 켤 수 있다.");
          }
        }

        if (!isMaster) {
          // 문서 세션은 자기 행 수정만. 새 문서 생성은 /api/doc/create 로.
          if (!body.id || body.id !== docId) {
            return NextResponse.json({ error: "이 문서에 대한 권한이 없다." }, { status: 403 });
          }
        }
      } else {
        if (!body.profileId) {
          return NextResponse.json({ error: "profileId 가 필요하다." }, { status: 400 });
        }
        if (!isMaster && body.profileId !== docId) {
          return NextResponse.json({ error: "이 문서에 대한 권한이 없다." }, { status: 403 });
        }
        clean.profile_id = body.profileId;

        // 문서 세션이 남의 행 id 를 넘겨 덮어쓰는 것을 막는다.
        if (!isMaster && body.id) {
          const { data: owned } = await admin
            .from(spec.table)
            .select("profile_id")
            .eq("id", body.id)
            .maybeSingle();
          if (!owned || owned.profile_id !== docId) {
            return NextResponse.json({ error: "이 항목에 대한 권한이 없다." }, { status: 403 });
          }
        }
      }

      let result;
      if (body.id) {
        result = await admin.from(spec.table).update(clean).eq("id", body.id).select().single();
      } else {
        result = await admin.from(spec.table).insert(clean).select().single();
      }
      if (result.error) throw new Error(result.error.message);

      revalidatePath("/", "layout");
      const row = isProfileTable
        ? stripSecret(result.data as Record<string, unknown>)
        : result.data;
      return NextResponse.json({ row });
    }

    /* ---------------- delete ---------------- */
    if (body.action === "delete") {
      if (!body.id) {
        return NextResponse.json({ error: "id 가 필요하다." }, { status: 400 });
      }

      if (isProfileTable) {
        // 문서 전체 삭제는 마스터 + 인증키 재입력만. 문서 세션은 불가 —
        // 비밀번호 하나로 문서가 통째로 사라지는 사고를 막는다.
        if (!isMaster) {
          // 일반 사용자에게는 상위 권한의 존재를 드러내지 않는다.
          return NextResponse.json({ error: "문서 삭제 권한이 없다." }, { status: 403 });
        }
        if (!verifyKey(body.confirmKey ?? "")) {
          return NextResponse.json(
            { error: "문서 삭제에는 인증키 재입력이 필요하다." },
            { status: 403 },
          );
        }
      } else if (!isMaster) {
        // 문서 세션: 자기 문서에 딸린 행인지 확인하고 지운다.
        const { data: owned } = await admin
          .from(spec.table)
          .select("profile_id")
          .eq("id", body.id)
          .maybeSingle();
        if (!owned || owned.profile_id !== docId) {
          return NextResponse.json({ error: "이 항목에 대한 권한이 없다." }, { status: 403 });
        }
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
