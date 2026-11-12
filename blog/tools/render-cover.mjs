// 규칙 v2 썸네일: 1:1 정사각 커버형 (흰 배경 · 컬러 강조 · 깔끔한 고딕) — 1080x1080 PNG
// 사용법: node blog/tools/render-cover.mjs blog/posts/<블로그키>/<날짜> [--only 01,02]
// 글 폴더 meta.json 의 cover 를 읽어 배치 폴더에 NN_키워드(카테고리)_썸네일.png 를 만든다.
//
// meta.cover
//   title     "국가장학금 1차\n**신청 기간** 확인"   (\n = 줄바꿈, 최대 3줄, **강조** = 카테고리 색)
//   subtitle  "2027년 1학기 · 자격과 서류까지 한 번에"  (한 줄, 24자 안팎)
//   badge     (선택) 오른쪽 위 작은 글씨. 없으면 카테고리 이름만 표시
import { createRequire } from "node:module";
import { readdirSync, readFileSync, existsSync, mkdirSync } from "node:fs";
import { join, resolve, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const require = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = require("playwright"));
} catch {
  ({ chromium } = require("/opt/node-tools/node_modules/playwright"));
}

const FONT_DIR = join(dirname(fileURLToPath(import.meta.url)), "fonts");
const FONT = "NotoSansKR.ttf";
mkdirSync(FONT_DIR, { recursive: true });
if (!existsSync(join(FONT_DIR, FONT)))
  execFileSync("curl", ["-sSfL", "-o", join(FONT_DIR, FONT), "https://raw.githubusercontent.com/google/fonts/main/ofl/notosanskr/NotoSansKR%5Bwght%5D.ttf"]);

const COLORS = {
  장학금: ["#1f5fd1", "#e8f0ff"], 봉사: ["#1d9a5b", "#e3f6ec"], 대외활동: ["#e5533d", "#ffece8"],
  비즈니스: ["#2348a8", "#e7ecfb"], 경제: ["#0f8a55", "#e2f5ec"], 사회: ["#6a3fb5", "#efe8fb"],
  게임: ["#7b2cbf", "#f1e6fb"], AI기술: ["#0f8f80", "#e0f5f2"],
};
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const safe = (s) => String(s).replace(/[\\/:*?"<>|]/g, "").trim();

function html(meta, blogName) {
  const [main, soft] = COLORS[meta.category] ?? ["#334155", "#eef2f6"];
  const lines = meta.cover.title.split("\n").slice(0, 3);
  const len = Math.max(...lines.map((l) => l.replace(/\*\*/g, "").length));
  const size = Math.min(124, Math.floor(900 / Math.max(len, 1)));
  const title = lines
    .map((l) => esc(l).replace(/\*\*(.+?)\*\*/g, `<em>$1</em>`))
    .join("<br>");
  return `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:'Noto Sans KR';src:url(https://cover.local/fonts/${FONT});font-weight:100 900}
*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;height:1080px;background:#fff;font-family:'Noto Sans KR',sans-serif;color:#111;position:relative;overflow:hidden}
.top{position:absolute;top:0;left:0;right:0;height:22px;background:${main}}
.chip{position:absolute;top:92px;left:90px;background:${main};color:#fff;font-size:34px;font-weight:700;padding:10px 26px;border-radius:40px;letter-spacing:-0.5px}
.badge{position:absolute;top:104px;right:90px;font-size:28px;font-weight:600;color:${main}}
.main{position:absolute;left:90px;right:80px;top:200px;bottom:200px;display:flex;flex-direction:column;justify-content:center;gap:56px}
.title{font-size:${size}px;font-weight:900;line-height:1.22;letter-spacing:-0.04em;word-break:keep-all}
.title em{font-style:normal;color:${main};background:linear-gradient(transparent 62%, ${soft} 62%)}
.sub{font-size:42px;font-weight:500;color:#444;letter-spacing:-0.02em;padding-left:26px;border-left:8px solid ${main};line-height:1.4}
.foot{position:absolute;left:90px;right:90px;bottom:90px;display:flex;justify-content:space-between;align-items:center;border-top:2px solid #eee;padding-top:26px}
.blog{font-size:28px;font-weight:700;color:#888}
.dots{display:flex;gap:12px}.dots i{width:16px;height:16px;border-radius:50%;background:${main}}.dots i:nth-child(2){opacity:.55}.dots i:nth-child(3){opacity:.25}
</style></head><body>
<div class="top"></div>
<div class="chip">${esc(meta.category)}</div>
${meta.cover.badge ? `<div class="badge">${esc(meta.cover.badge)}</div>` : ""}
<div class="main"><div class="title">${title}</div>
<div class="sub">${esc(meta.cover.subtitle ?? "")}</div></div>
<div class="foot"><span class="blog">${esc(blogName)}</span><span class="dots"><i></i><i></i><i></i></span></div>
</body></html>`;
}

const root = resolve(process.argv[2] ?? ".");
const onlyIdx = process.argv.indexOf("--only");
const only = onlyIdx > 0 ? process.argv[onlyIdx + 1].split(",") : null;
const key = basename(resolve(root, ".."));
const conf = JSON.parse(readFileSync(resolve(root, "../../../blogs.json"), "utf8"))[key];
const batchDir = join(root, `배치_${basename(root).replace(/-/g, "")}_${conf.batchName}`);
mkdirSync(batchDir, { recursive: true });
const dirs = readdirSync(root, { withFileTypes: true })
  .filter((d) => d.isDirectory() && existsSync(join(root, d.name, "meta.json")))
  .filter((d) => !only || only.some((n) => d.name.startsWith(n + "-")))
  .map((d) => join(root, d.name))
  .sort();

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1080 } });
await page.route("https://cover.local/fonts/*", (route) =>
  route.fulfill({ body: readFileSync(join(FONT_DIR, FONT)), contentType: "font/ttf" }),
);
for (const dir of dirs) {
  const meta = JSON.parse(readFileSync(join(dir, "meta.json"), "utf8"));
  if (!meta.cover?.title) { console.warn(`! ${basename(dir)}: cover.title 없음`); continue; }
  await page.setContent(html(meta, conf.displayName ?? conf.batchName));
  await page.evaluate(() => document.fonts.ready);
  const out = join(batchDir, `${meta.no}_${safe(meta.keyword)}(${meta.category})_썸네일.png`);
  await page.screenshot({ path: out });
  console.log(`rendered ${out}`);
}
await browser.close();
