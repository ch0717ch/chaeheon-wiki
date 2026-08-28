// Next.js 를 Cloudflare Workers 에서 실행하기 위한 OpenNext 어댑터 설정.
// 기본값으로 충분하다 — 캐시 바인딩 등은 필요해질 때 추가한다.
import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig();
