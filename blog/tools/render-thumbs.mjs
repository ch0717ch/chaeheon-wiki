// 네이버 블로그 썸네일 렌더러 (1080x1080 PNG)
// 사용법: node blog/tools/render-thumbs.mjs blog/posts/2026-10-02
// 각 글 폴더의 thumb.json 을 읽어 같은 폴더에 thumb.png 를 만든다.
import { createRequire } from "node:module";
import { readdirSync, readFileSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

// 폰트는 로컬 파일로 받아서 쓴다 (헤드리스 크롬이 Google Fonts CDN 에 못 붙는 환경 대비).
// 처음 실행할 때 google/fonts 저장소에서 자동으로 내려받고 fonts/ 에 캐시한다(.gitignore 처리).
const FONT_DIR = join(dirname(fileURLToPath(import.meta.url)), "fonts");
const FONTS = {
  "BlackHanSans-Regular.ttf": "https://raw.githubusercontent.com/google/fonts/main/ofl/blackhansans/BlackHanSans-Regular.ttf",
  "NotoSansKR.ttf": "https://raw.githubusercontent.com/google/fonts/main/ofl/notosanskr/NotoSansKR%5Bwght%5D.ttf",
};
mkdirSync(FONT_DIR, { recursive: true });
for (const [name, url] of Object.entries(FONTS)) {
  if (!existsSync(join(FONT_DIR, name))) execFileSync("curl", ["-sSfL", "-o", join(FONT_DIR, name), url]);
}

const require = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = require("playwright"));
} catch {
  ({ chromium } = require("/opt/node-tools/node_modules/playwright"));
}

// 카테고리별 색 — 블로그 전체가 "같은 시리즈"로 보이게 3색만 쓴다.
const THEMES = {
  scholarship: { bg: "#0b1f44", bg2: "#132d5e", accent: "#ffd400", ink: "#0b1f44", label: "장학금" },
  volunteer: { bg: "#0b3d2e", bg2: "#11533f", accent: "#c6ff3d", ink: "#0b3d2e", label: "봉사" },
  activity: { bg: "#3a0d1e", bg2: "#5a1530", accent: "#ff8a3d", ink: "#3a0d1e", label: "대외활동" },
};

const esc = (s) =>
  String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

// "**강조**" 구간은 형광펜 처리
const rich = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<span class="hl">$1</span>');

function buildHtml(spec) {
  const t = THEMES[spec.theme] ?? THEMES.scholarship;
  const lines = spec.lines.map((l) => `<div class="line">${rich(l)}</div>`).join("");
  const points = (spec.points ?? [])
    .map((p, i) => `<li><b>${i + 1}</b><span>${rich(p)}</span></li>`)
    .join("");
  const size = spec.headlineSize ?? 118;
  return `<!doctype html><html><head><meta charset="utf-8">
<style>
@font-face{font-family:'Black Han Sans';src:url(https://thumb.local/fonts/BlackHanSans-Regular.ttf)}
@font-face{font-family:'Noto Sans KR';src:url(https://thumb.local/fonts/NotoSansKR.ttf);font-weight:100 900}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:1080px;height:1080px}
body{font-family:'Noto Sans KR',sans-serif;color:#fff;overflow:hidden;
 background:
  repeating-linear-gradient(135deg, rgba(255,255,255,.035) 0 22px, transparent 22px 44px),
  radial-gradient(circle at 85% 12%, ${t.bg2} 0, ${t.bg} 60%);}
.wrap{position:absolute;inset:0;padding:78px 80px 70px;display:flex;flex-direction:column}
.top{display:flex;gap:14px;align-items:center}
.badge{background:${t.accent};color:${t.ink};font-weight:900;font-size:38px;padding:12px 28px;border-radius:999px;letter-spacing:-1px}
.cat{border:3px solid rgba(255,255,255,.55);font-weight:700;font-size:32px;padding:9px 24px;border-radius:999px;color:rgba(255,255,255,.9)}
.head{margin-top:54px;font-family:'Black Han Sans',sans-serif;font-size:${size}px;line-height:1.16;letter-spacing:-2px;word-break:keep-all}
.hl{color:${t.ink};background:${t.accent};padding:0 14px;border-radius:10px;box-decoration-break:clone;-webkit-box-decoration-break:clone}
.sub{margin-top:34px;font-size:42px;font-weight:700;color:rgba(255,255,255,.82);letter-spacing:-1px;word-break:keep-all}
.card{margin-top:auto;background:#fff;color:#111;border-radius:28px;padding:30px 36px}
.card ul{list-style:none;display:flex;flex-direction:column;gap:14px}
.card li{display:flex;align-items:center;gap:18px;font-size:36px;font-weight:700;letter-spacing:-1px}
.card li b{flex:none;width:52px;height:52px;border-radius:50%;background:${t.bg};color:${t.accent};display:flex;align-items:center;justify-content:center;font-size:30px;font-weight:900}
.card .hl{color:#111;background:linear-gradient(transparent 55%, ${t.accent} 55%);padding:0 4px}
.foot{margin-top:26px;display:flex;justify-content:space-between;font-size:28px;font-weight:700;color:rgba(255,255,255,.7)}
</style></head><body><div class="wrap">
<div class="top"><span class="badge">${esc(spec.badge)}</span><span class="cat">${esc(spec.category ?? t.label)}</span></div>
<div class="head">${lines}</div>
${spec.sub ? `<div class="sub">${rich(spec.sub)}</div>` : ""}
${points ? `<div class="card"><ul>${points}</ul></div>` : ""}
<div class="foot"><span>대학생활 정보노트 · 에디</span><span>${esc(spec.footRight ?? "저장해두고 보세요")}</span></div>
</div></body></html>`;
}

const root = resolve(process.argv[2] ?? ".");
const dirs = existsSync(join(root, "thumb.json"))
  ? [root]
  : readdirSync(root, { withFileTypes: true })
      .filter((d) => d.isDirectory() && existsSync(join(root, d.name, "thumb.json")))
      .map((d) => join(root, d.name));

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1080 } });
await page.route("https://thumb.local/fonts/*", (route) =>
  route.fulfill({ body: readFileSync(join(FONT_DIR, route.request().url().split("/").pop())), contentType: "font/ttf" }),
);
for (const dir of dirs) {
  const spec = JSON.parse(readFileSync(join(dir, "thumb.json"), "utf8"));
  const html = buildHtml(spec);
  writeFileSync(join(dir, "thumb.preview.html"), html);
  await page.setContent(html, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: join(dir, "thumb.png") });
  console.log("rendered", join(dir, "thumb.png"));
}
await browser.close();
