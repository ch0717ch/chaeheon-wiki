import "server-only";
import { cookies } from "next/headers";
import {
  ADMIN_COOKIE,
  docCookieName,
  verifyDocToken,
  verifyToken,
} from "@/lib/adminAuth";
import type { Profile } from "@/types";

/**
 * 지금 요청한 사람이 이 문서 본문을 볼 수 있는가.
 * 잠긴 문서는 마스터 세션 또는 그 문서의 비밀번호 세션이 있어야 한다.
 *
 * 레이아웃만 막으면 안 된다. App Router 는 레이아웃이 children 을 그리지
 * 않아도 페이지를 따로 렌더해 그 결과를 페이지 데이터(RSC)에 실어 보낸다.
 * 그래서 화면은 잠금창인데 소스에는 본문이 들어 있었다. 본문을 만드는
 * 페이지마다 이 함수로 먼저 거른다.
 *
 * cookies() 는 잠긴 문서에서만 부른다.
 */
export async function canViewProfile(
  profile: Pick<Profile, "id" | "view_locked">,
): Promise<boolean> {
  if (!profile.view_locked) return true;
  const jar = await cookies();
  if (verifyToken(jar.get(ADMIN_COOKIE)?.value)) return true;
  return verifyDocToken(jar.get(docCookieName(profile.id))?.value, profile.id);
}
