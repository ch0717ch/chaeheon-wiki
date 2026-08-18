import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE, verifyToken } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

// 사진·PDF 업로드. documents 공개 버킷에 넣고 공개 URL 을 돌려준다.
// 공개 버킷이므로 여기로는 공개해도 되는 파일만 올린다.

const ALLOWED: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};
const MAX_BYTES = 15 * 1024 * 1024; // 15MB

export async function POST(req: Request) {
  const jar = await cookies();
  if (!verifyToken(jar.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ error: "인증이 필요하다." }, { status: 401 });
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json({ error: "service role 키가 설정되지 않았다." }, { status: 500 });
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file 필드가 없다." }, { status: 400 });
  }
  const ext = ALLOWED[file.type];
  if (!ext) {
    return NextResponse.json(
      { error: `허용되지 않는 형식(${file.type}). jpg/png/webp/pdf 만.` },
      { status: 400 },
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "15MB 를 넘는 파일은 올릴 수 없다." }, { status: 400 });
  }

  // 원본 이름은 신뢰하지 않는다. 시각 + 무작위 조각으로 경로를 만든다.
  const stamp = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14);
  const rand = Math.random().toString(36).slice(2, 8);
  const path = `uploads/${stamp}-${rand}.${ext}`;

  const bytes = Buffer.from(await file.arrayBuffer());
  const { error } = await admin.storage
    .from("documents")
    .upload(path, bytes, { contentType: file.type, upsert: false });
  if (error) {
    return NextResponse.json({ error: `업로드 실패: ${error.message}` }, { status: 500 });
  }

  const { data } = admin.storage.from("documents").getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl, path });
}
