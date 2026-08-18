import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE, verifyToken } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

// =====================================================================
// 대용량 업로드용 서명 URL 발급.
//
// Netlify 함수는 요청 본문 6MB 제한이 있어 wav 같은 음원을 서버 경유로
// 받을 수 없다. 대신 서버는 "이 경로에 올려도 된다"는 서명 URL 만 발급하고,
// 브라우저가 Supabase Storage 에 직접 올린다. 파일은 Netlify 를 거치지 않는다.
// 서명 URL 은 경로 하나에만 유효하고 2시간 뒤 만료된다.
// =====================================================================

const ALLOWED: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
  "audio/mpeg": "mp3",
  "audio/mp3": "mp3",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
  "audio/wave": "wav",
};

export async function POST(req: Request) {
  const jar = await cookies();
  if (!verifyToken(jar.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ error: "인증이 필요하다." }, { status: 401 });
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json({ error: "service role 키가 설정되지 않았다." }, { status: 500 });
  }

  let contentType = "";
  try {
    const body = await req.json();
    contentType = typeof body?.contentType === "string" ? body.contentType : "";
  } catch {
    /* 아래에서 거른다 */
  }

  const ext = ALLOWED[contentType];
  if (!ext) {
    return NextResponse.json(
      { error: `허용되지 않는 형식(${contentType || "없음"}).` },
      { status: 400 },
    );
  }

  const stamp = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14);
  const rand = Math.random().toString(36).slice(2, 8);
  const path = `uploads/${stamp}-${rand}.${ext}`;

  const { data, error } = await admin.storage.from("documents").createSignedUploadUrl(path);
  if (error || !data) {
    return NextResponse.json(
      { error: `서명 URL 발급 실패: ${error?.message ?? "알 수 없음"}` },
      { status: 500 },
    );
  }

  const { data: pub } = admin.storage.from("documents").getPublicUrl(path);
  return NextResponse.json({
    path,
    token: data.token,
    signedUrl: data.signedUrl,
    publicUrl: pub.publicUrl,
  });
}
