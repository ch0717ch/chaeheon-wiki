// 네이버 블로그 썸네일 렌더러 (1080x1080 PNG) — "잡지 표지형" 스타일
// 사용법: node blog/tools/render-thumbs.mjs blog/posts/2026-10-02
// 각 글 폴더의 thumb.json 을 읽어 같은 폴더에 thumb.png 를 만든다.
//
// 구성 (레퍼런스: 쓰리휴먼스 블로그 썸네일)
//   ① 좌상단 기울어진 빨간 붓터치 배너 + 노란 강조선
//   ② 흰/노랑/하늘 그라데이션 + 검은 두꺼운 외곽선 + 그림자의 초대형 제목 3줄 (기울임)
//   ③ 오른쪽에 주제 소품(폰·여권·확인서 등)이 놓인 책상 장면
//   ④ 노란 포스트잇 손글씨 체크리스트
//   ⑤ 하단 4칸 미리보기 타일 (그림 + 검정/빨강 2줄 캡션)
//
// thumb.json 키
//   banner   "국가장학금 **바뀐다?!**"   (**강조** = 노란 글씨)
//   title    ["학자금 구간", "10→5개", "대개편?"]  (1줄 흰색, 2줄 노랑, 3줄 하늘)
//   note     ["구간 변환표", ...] 4개
//   hero     { "type": "phone|passport|certificate", ...내용 }
//   tiles    [{ "icon": "table|coin|calendar|check|globe|warning|doc|phone|stamp|question", "top": "", "bottom": "" }] 4개
//   bg       (선택) 배경 사진 경로 — 있으면 그려진 책상 장면 대신 사용
import { createRequire } from "node:module";
import { readdirSync, readFileSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { join, resolve, dirname, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const require = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = require("playwright"));
} catch {
  ({ chromium } = require("/opt/node-tools/node_modules/playwright"));
}

// 폰트는 로컬 파일로 받아서 쓴다 (헤드리스 크롬이 Google Fonts CDN 에 못 붙는 환경 대비).
// 처음 실행할 때 google/fonts 저장소에서 자동으로 내려받고 fonts/ 에 캐시한다(.gitignore 처리).
const FONT_DIR = join(dirname(fileURLToPath(import.meta.url)), "fonts");
const GF = "https://raw.githubusercontent.com/google/fonts/main/ofl/";
const FONTS = {
  "BlackHanSans-Regular.ttf": GF + "blackhansans/BlackHanSans-Regular.ttf",
  "NotoSansKR.ttf": GF + "notosanskr/NotoSansKR%5Bwght%5D.ttf",
  "Jua-Regular.ttf": GF + "jua/Jua-Regular.ttf",
  "NanumPenScript-Regular.ttf": GF + "nanumpenscript/NanumPenScript-Regular.ttf",
};
mkdirSync(FONT_DIR, { recursive: true });
for (const [name, url] of Object.entries(FONTS)) {
  if (!existsSync(join(FONT_DIR, name))) execFileSync("curl", ["-sSfL", "-o", join(FONT_DIR, name), url]);
}

const esc = (s) =>
  String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

// 테마별 소품 색
const THEMES = {
  scholarship: { main: "#1f4fa3", soft: "#dbe7ff", deep: "#0b1f44" },
  volunteer: { main: "#1d7a55", soft: "#d9f5e6", deep: "#0b3d2e" },
  activity: { main: "#b4234a", soft: "#ffe0e8", deep: "#3a0d1e" },
};

/* ───────────── 배경: 창가 햇살 + 원목 책상 장면 ───────────── */
function deskScene(t) {
  return `<svg class="bg" viewBox="0 0 1080 1080" xmlns="http://www.w3.org/2000/svg">
<defs>
 <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6efe4"/><stop offset="1" stop-color="#e9dccb"/></linearGradient>
 <linearGradient id="wood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d9b48a"/><stop offset="1" stop-color="#b98a5e"/></linearGradient>
 <radialGradient id="sun" cx="0.85" cy="0.1" r="0.7"><stop offset="0" stop-color="#fff7d6" stop-opacity=".95"/><stop offset="1" stop-color="#fff7d6" stop-opacity="0"/></radialGradient>
 <filter id="blur8"><feGaussianBlur stdDeviation="8"/></filter>
 <filter id="blur3"><feGaussianBlur stdDeviation="3"/></filter>
 <pattern id="grain" width="120" height="14" patternUnits="userSpaceOnUse"><path d="M0 7 Q30 3 60 7 T120 7" stroke="#a67a50" stroke-opacity=".25" fill="none" stroke-width="2"/></pattern>
</defs>
<rect width="1080" height="1080" fill="url(#wall)"/>
<g filter="url(#blur8)" opacity=".55">
 <rect x="640" y="-20" width="420" height="560" fill="#fffaf0"/>
 <rect x="840" y="-20" width="14" height="560" fill="#cdb79c"/>
 <rect x="640" y="260" width="420" height="14" fill="#cdb79c"/>
</g>
<g filter="url(#blur8)" opacity=".7">
 <ellipse cx="70" cy="120" rx="70" ry="30" fill="#7fae6b" transform="rotate(-30 70 120)"/>
 <ellipse cx="140" cy="70" rx="60" ry="24" fill="#94c27c" transform="rotate(25 140 70)"/>
 <ellipse cx="40" cy="230" rx="66" ry="26" fill="#6c9c5a" transform="rotate(-60 40 230)"/>
 <ellipse cx="170" cy="180" rx="50" ry="20" fill="#86b872" transform="rotate(40 170 180)"/>
</g>
<rect width="1080" height="1080" fill="url(#sun)"/>
<g filter="url(#blur3)" opacity=".5">
 <circle cx="560" cy="90" r="26" fill="#fff"/><circle cx="980" cy="420" r="18" fill="#fff"/><circle cx="420" cy="40" r="14" fill="#fff"/>
</g>
<rect y="560" width="1080" height="520" fill="url(#wood)"/>
<rect y="560" width="1080" height="520" fill="url(#grain)"/>
<rect y="556" width="1080" height="10" fill="#c79f74"/>
<rect y="566" width="1080" height="30" fill="#000" opacity=".06" filter="url(#blur3)"/>
<g opacity=".9">
 <rect x="20" y="490" width="120" height="80" rx="6" fill="${t.soft}" transform="rotate(-4 80 530)"/>
 <rect x="30" y="470" width="110" height="26" rx="4" fill="${t.main}" opacity=".75" transform="rotate(-4 80 480)"/>
</g>
</svg>`;
}

/* ───────────── 오른쪽 주제 소품 ───────────── */
function heroPhone(h, t) {
  const rows = (h.rows ?? [])
    .map(
      ([l, r], i) => `<div class="prow"><span>${esc(l)}</span><b style="background:${["#ffd400", "#7fd3ff", "#b8f28a", "#ffb4c8", "#d9d9d9"][i % 5]}">${esc(r)}</b></div>`,
    )
    .join("");
  return `<div class="hero" style="left:560px;top:110px;">
  <div class="paper" style="left:-40px;top:120px;transform:rotate(-9deg);">
    <div class="ptitle" style="color:${t.main}">${esc(h.paper ?? "")}</div>
    <i></i><i></i><i style="width:70%"></i><i></i><i style="width:55%"></i><i></i><i style="width:80%"></i>
  </div>
  <div class="phone" style="transform:rotate(7deg);">
    <div class="notch"></div>
    <div class="screen">
      <div class="phead" style="background:${t.main}">${esc(h.header ?? "")}</div>
      <div class="psub">${esc(h.sub ?? "")}</div>
      ${rows}
    </div>
  </div>
</div>`;
}

function heroPassport(h, t) {
  return `<div class="hero" style="left:540px;top:110px;">
  <div class="passport" style="transform:rotate(9deg);background:${t.deep};">
    <div class="pp1">PASSPORT</div>
    <svg viewBox="0 0 100 100" width="150" height="150"><circle cx="50" cy="50" r="40" fill="none" stroke="#e9c46a" stroke-width="5"/><ellipse cx="50" cy="50" rx="18" ry="40" fill="none" stroke="#e9c46a" stroke-width="4"/><path d="M10 50 H90 M18 30 H82 M18 70 H82" stroke="#e9c46a" stroke-width="4"/></svg>
    <div class="pp2">${esc(h.label ?? "해외봉사단")}</div>
  </div>
  <div class="ticket" style="left:20px;top:440px;transform:rotate(-7deg);">
    <div class="tl"><small>BOARDING PASS</small><b>${esc(h.from ?? "ICN")} <span>✈</span> ${esc(h.to ?? "???")}</b><small>${esc(h.ticketNote ?? "")}</small></div>
    <div class="tr"><small>SEAT</small><b>${esc(h.seat ?? "VOL")}</b></div>
  </div>
  <div class="stampc" style="left:20px;top:250px;border-color:#e5383b;color:#e5383b">${esc(h.stamp ?? "합격")}</div>
</div>`;
}

function heroCertificate(h, t) {
  const rows = (h.rows ?? []).map(([a, b]) => `<tr><td>${esc(a)}</td><td>${esc(b)}</td></tr>`).join("");
  return `<div class="hero" style="left:560px;top:100px;">
  <div class="paper" style="left:70px;top:40px;transform:rotate(10deg);width:400px;height:540px;">
    <div class="ptitle" style="color:${t.main}">${esc(h.paper ?? "")}</div><i></i><i></i><i style="width:60%"></i><i></i><i></i>
  </div>
  <div class="cert" style="transform:rotate(-5deg);">
    <div class="ctop" style="border-color:${t.main}">${esc(h.title ?? "확인서")}</div>
    <div class="cno">${esc(h.noText ?? "발급번호 " + (h.no ?? "2026-0000-0000"))}</div>
    <table>${rows}</table>
    <i></i><i style="width:70%"></i><i style="width:85%"></i>
    <div class="cstamp">${esc(h.stamp ?? "확인")}</div>
  </div>
</div>`;
}

const HEROES = { phone: heroPhone, passport: heroPassport, certificate: heroCertificate };

/* ───────────── 하단 타일 미니 그림 ───────────── */
const ICONS = {
  table: `<rect x="40" y="18" width="140" height="94" rx="8" fill="#fff" stroke="#333" stroke-width="3"/><path d="M40 42H180M40 66H180M40 90H180M100 18V112" stroke="#333" stroke-width="3"/><rect x="42" y="20" width="136" height="20" fill="#1f4fa3"/><rect x="104" y="46" width="70" height="16" rx="4" fill="#ffd400"/>`,
  coin: `<ellipse cx="110" cy="100" rx="60" ry="14" fill="#c9971c"/><rect x="50" y="72" width="120" height="28" fill="#e9b52c"/><ellipse cx="110" cy="72" rx="60" ry="14" fill="#ffd45c"/><rect x="62" y="44" width="96" height="28" fill="#e9b52c"/><ellipse cx="110" cy="44" rx="48" ry="12" fill="#ffd45c"/><text x="110" y="52" font-size="22" text-anchor="middle" font-weight="900" fill="#9a6b00">₩</text><path d="M178 30 l14 -14 M186 46 l20 -4" stroke="#e23" stroke-width="5" stroke-linecap="round"/>`,
  calendar: `<rect x="50" y="22" width="120" height="96" rx="8" fill="#fff" stroke="#333" stroke-width="3"/><rect x="50" y="22" width="120" height="24" rx="6" fill="#e5383b"/><g fill="#999">${[0, 1, 2, 3, 4].map((c) => [0, 1, 2].map((r) => `<rect x="${60 + c * 21}" y="${56 + r * 19}" width="12" height="10" rx="2"/>`).join("")).join("")}</g><ellipse cx="128" cy="80" rx="20" ry="15" fill="none" stroke="#e5383b" stroke-width="5"/><path d="M78 14v18M142 14v18" stroke="#555" stroke-width="5" stroke-linecap="round"/>`,
  check: `<rect x="55" y="16" width="110" height="104" rx="8" fill="#fff" stroke="#333" stroke-width="3"/>${[0, 1, 2].map((i) => `<rect x="68" y="${30 + i * 28}" width="18" height="18" rx="3" fill="none" stroke="#333" stroke-width="3"/><path d="M70 ${38 + i * 28} l6 6 l12 -14" stroke="#e5383b" stroke-width="5" fill="none" stroke-linecap="round"/><rect x="94" y="${34 + i * 28}" width="58" height="8" rx="4" fill="#bbb"/>`).join("")}`,
  globe: `<circle cx="110" cy="68" r="48" fill="#5fb3ff" stroke="#235" stroke-width="3"/><path d="M80 40 q20 10 10 30 q-12 10 4 26 M120 28 q14 18 30 14 M128 80 q14 4 20 20" stroke="#3fae5a" stroke-width="14" fill="none" stroke-linecap="round"/><path d="M150 26 l30 -6 -8 12z" fill="#fff" stroke="#333" stroke-width="2"/>`,
  warning: `<path d="M110 18 L172 118 H48 Z" fill="#ffd400" stroke="#333" stroke-width="4" stroke-linejoin="round"/><rect x="104" y="50" width="12" height="40" rx="5" fill="#333"/><circle cx="110" cy="104" r="7" fill="#333"/>`,
  doc: `<rect x="40" y="24" width="80" height="96" rx="6" fill="#fff" stroke="#333" stroke-width="3" transform="rotate(-6 80 72)"/><rect x="100" y="18" width="80" height="96" rx="6" fill="#fff" stroke="#333" stroke-width="3" transform="rotate(6 140 66)"/><text x="80" y="76" font-size="20" text-anchor="middle" font-weight="900" fill="#1f4fa3" transform="rotate(-6 80 72)">1365</text><text x="140" y="70" font-size="20" text-anchor="middle" font-weight="900" fill="#1d7a55" transform="rotate(6 140 66)">VMS</text><circle cx="110" cy="70" r="20" fill="#e5383b"/><text x="110" y="78" font-size="20" text-anchor="middle" font-weight="900" fill="#fff">VS</text>`,
  phone: `<rect x="78" y="10" width="64" height="116" rx="12" fill="#222"/><rect x="84" y="20" width="52" height="96" rx="4" fill="#fff"/>${[0, 1, 2].map((i) => `<circle cx="96" cy="${38 + i * 28}" r="8" fill="#e5383b"/><text x="96" y="${43 + i * 28}" font-size="12" text-anchor="middle" fill="#fff" font-weight="900">${i + 1}</text><rect x="108" y="${34 + i * 28}" width="22" height="8" rx="4" fill="#bbb"/>`).join("")}`,
  stamp: `<rect x="50" y="20" width="100" height="100" rx="6" fill="#fff" stroke="#333" stroke-width="3"/><path d="M62 44H138M62 62H130M62 80H138" stroke="#bbb" stroke-width="6"/><circle cx="140" cy="88" r="32" fill="none" stroke="#e5383b" stroke-width="6"/><text x="140" y="96" font-size="22" text-anchor="middle" font-weight="900" fill="#e5383b">반려</text>`,
  question: `<circle cx="80" cy="60" r="42" fill="#7fd3ff" stroke="#333" stroke-width="3"/><text x="80" y="76" font-size="48" text-anchor="middle" font-weight="900" fill="#fff">Q</text><circle cx="150" cy="80" r="34" fill="#ffd400" stroke="#333" stroke-width="3"/><text x="150" y="94" font-size="38" text-anchor="middle" font-weight="900" fill="#333">A</text>`,
};
const TILE_BG = ["#e7f0ff", "#fff3d6", "#ffe6e6", "#e6f7ea"];

/* ───────────── 붓터치 배너 ───────────── */
function banner(text) {
  const parts = esc(text).split(/\*\*(.+?)\*\*/);
  const spans = parts.map((p, i) => (i % 2 ? `<tspan fill="#ffe14a">${p}</tspan>` : p)).join("");
  return `<svg class="banner" viewBox="0 0 640 150" width="640" height="150">
<defs><filter id="rough"><feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="3" seed="7"/><feDisplacementMap in="SourceGraphic" scale="18"/></filter>
<filter id="bsh"><feDropShadow dx="0" dy="6" stdDeviation="5" flood-opacity=".35"/></filter></defs>
<g filter="url(#bsh)"><path filter="url(#rough)" d="M18 34 L600 16 L622 40 L596 70 L616 104 L588 128 L30 138 L8 112 L26 84 L6 58 Z" fill="#e3262f"/></g>
<text id="btext" x="310" y="98" text-anchor="middle" font-family="Black Han Sans" font-size="66" fill="#fff" stroke="#7a0b10" stroke-width="5" paint-order="stroke">${spans}</text>
</svg>`;
}

/* ───────────── 초대형 외곽선 제목 ───────────── */
function title(lines) {
  const fills = ["#ffffff", "url(#gYellow)", "url(#gCyan)"];
  const sizes = [124, 172, 134];
  let y = 0;
  const texts = lines
    .map((l, i) => {
      y += sizes[i] * (i ? 0.98 : 0.9);
      return `<text class="tline" data-max="660" x="12" y="${y}" font-size="${sizes[i]}" fill="${fills[i]}">${esc(l)}</text>`;
    })
    .join("");
  return `<svg class="title" viewBox="0 0 700 520" width="700" height="520">
<defs>
 <linearGradient id="gYellow" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff35c"/><stop offset=".55" stop-color="#ffd400"/><stop offset="1" stop-color="#ffb800"/></linearGradient>
 <linearGradient id="gCyan" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d9fbff"/><stop offset=".5" stop-color="#5fe0ff"/><stop offset="1" stop-color="#22b8f0"/></linearGradient>
 <filter id="tsh" x="-10%" y="-10%" width="130%" height="140%"><feDropShadow dx="6" dy="10" stdDeviation="4" flood-color="#000" flood-opacity=".55"/></filter>
</defs>
<g filter="url(#tsh)" font-family="Black Han Sans" stroke="#0d0d14" stroke-width="26" stroke-linejoin="round" paint-order="stroke" letter-spacing="-4">${texts}</g>
</svg>`;
}

function buildHtml(spec, bgDataUrl) {
  const t = THEMES[spec.theme] ?? THEMES.scholarship;
  const hero = (HEROES[spec.hero?.type] ?? heroPhone)(spec.hero ?? {}, t);
  const note = (spec.note ?? [])
    .map((n) => `<li><svg width="34" height="34" viewBox="0 0 34 34"><rect x="3" y="5" width="24" height="24" fill="none" stroke="#222" stroke-width="3"/><path d="M8 16 l7 8 l16 -22" stroke="#222" stroke-width="4" fill="none" stroke-linecap="round"/></svg>${esc(n)}</li>`)
    .join("");
  const tiles = (spec.tiles ?? [])
    .map(
      (tl, i) => `<div class="tile"><div class="tpic" style="background:${TILE_BG[i % 4]}"><svg viewBox="0 0 220 134" width="220" height="134" font-family="Noto Sans KR">${ICONS[tl.icon] ?? ICONS.check}</svg></div><div class="tcap"><b>${esc(tl.top)}</b><em>${esc(tl.bottom)}</em></div></div>`,
    )
    .join("");
  const bg = bgDataUrl ? `<div class="bg" style="background:url(${bgDataUrl}) center/cover"></div>` : deskScene(t);

  return `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:'Black Han Sans';src:url(https://thumb.local/fonts/BlackHanSans-Regular.ttf)}
@font-face{font-family:'Noto Sans KR';src:url(https://thumb.local/fonts/NotoSansKR.ttf);font-weight:100 900}
@font-face{font-family:'Jua';src:url(https://thumb.local/fonts/Jua-Regular.ttf)}
@font-face{font-family:'Nanum Pen Script';src:url(https://thumb.local/fonts/NanumPenScript-Regular.ttf)}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:1080px;height:1080px;overflow:hidden;font-family:'Noto Sans KR',sans-serif}
.bg{position:absolute;inset:0;width:1080px;height:1080px}
.hero{position:absolute;width:480px;height:700px}
.paper{position:absolute;width:360px;height:470px;background:#fff;border-radius:6px;box-shadow:0 18px 30px rgba(60,40,20,.35);padding:34px 30px}
.paper .ptitle{font-family:'Jua';font-size:30px;margin-bottom:24px}
.paper i{display:block;height:12px;border-radius:6px;background:#e3e3e3;margin:16px 0;width:100%}
.phone{position:absolute;left:80px;top:0;width:360px;height:700px;border-radius:56px;background:#16161c;padding:18px;box-shadow:20px 30px 40px rgba(40,25,10,.45),inset 0 0 0 4px #3a3a44}
.notch{position:absolute;left:50%;top:26px;transform:translateX(-50%);width:110px;height:30px;border-radius:16px;background:#000;z-index:2}
.screen{width:100%;height:100%;border-radius:40px;background:#f7f8fb;overflow:hidden}
.phead{color:#fff;font-family:'Jua';font-size:34px;padding:74px 26px 22px}
.psub{font-size:22px;font-weight:700;color:#666;padding:16px 26px 6px}
.prow{display:flex;justify-content:space-between;align-items:center;margin:12px 20px;background:#fff;border-radius:16px;padding:16px 18px;box-shadow:0 3px 8px rgba(0,0,0,.08);font-size:26px;font-weight:800;color:#222}
.prow b{min-width:58px;text-align:center;border-radius:12px;padding:4px 10px;font-family:'Jua';font-size:30px;color:#222}
.passport{position:absolute;left:150px;top:20px;width:320px;height:440px;border-radius:14px 22px 22px 14px;box-shadow:18px 26px 36px rgba(40,25,10,.45),inset 14px 0 0 rgba(0,0,0,.25);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:28px;color:#e9c46a}
.pp1{font-family:'Black Han Sans';font-size:46px;letter-spacing:4px}
.pp2{font-family:'Jua';font-size:34px}
.ticket{position:absolute;width:440px;height:170px;background:#fff;border-radius:16px;display:flex;box-shadow:0 18px 30px rgba(60,40,20,.35);overflow:hidden}
.ticket .tl{flex:1;padding:20px 24px;display:flex;flex-direction:column;justify-content:space-between;border-right:4px dashed #ccc}
.ticket .tr{width:120px;padding:20px;display:flex;flex-direction:column;justify-content:space-between;background:#ffd400}
.ticket small{font-size:18px;font-weight:800;color:#888;letter-spacing:2px}
.ticket b{font-family:'Black Han Sans';font-size:48px;color:#222}
.ticket .tr b{font-size:32px;white-space:nowrap}
.stampc{position:absolute;width:150px;height:150px;border:8px solid;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:'Black Han Sans';font-size:34px;transform:rotate(-16deg);opacity:.85;background:rgba(255,255,255,.35)}
.cert{position:absolute;left:20px;top:20px;width:430px;height:580px;background:#fffdf7;border-radius:8px;box-shadow:16px 26px 36px rgba(40,25,10,.45);padding:36px 34px}
.ctop{font-family:'Black Han Sans';font-size:40px;text-align:center;border-bottom:5px double;padding-bottom:16px;color:#222}
.cno{font-size:18px;font-weight:700;color:#e5383b;margin:14px 0 18px;text-align:right}
.cert table{width:100%;border-collapse:collapse;font-size:22px;font-weight:700}
.cert td{border:2px solid #444;padding:10px 12px}
.cert td:first-child{background:#f0eadc;width:40%}
.cert i{display:block;height:11px;border-radius:6px;background:#e3e0d6;margin:18px 0;width:100%}
.cstamp{position:absolute;right:40px;bottom:42px;width:120px;height:120px;border:7px solid #e5383b;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#e5383b;font-family:'Black Han Sans';font-size:40px;transform:rotate(-14deg);opacity:.9}
.banner{position:absolute;left:18px;top:40px;transform:rotate(-6deg);overflow:visible}
.spark{position:absolute;left:640px;top:14px}
.title{position:absolute;left:14px;top:168px;transform:rotate(-5deg);overflow:visible}
.note{position:absolute;left:44px;top:606px;width:340px;padding:24px 24px 16px;background:linear-gradient(#fff27a,#ffe94a);transform:rotate(-4deg);box-shadow:6px 12px 18px rgba(60,40,0,.35)}
.note:before{content:"";position:absolute;left:120px;top:-16px;width:110px;height:34px;background:rgba(255,255,255,.6);transform:rotate(3deg)}
.note ul{list-style:none}
.note li{display:flex;align-items:center;gap:12px;font-family:'Nanum Pen Script';font-size:42px;line-height:1.05;color:#1a1a1a}
.pen{position:absolute;left:370px;top:740px;transform:rotate(-28deg)}
.tiles{position:absolute;left:24px;right:24px;bottom:22px;display:flex;gap:12px}
.tile{flex:1;background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 8px 18px rgba(40,25,10,.35)}
.tpic{height:134px;display:flex;align-items:center;justify-content:center;border-bottom:2px solid #eee}
.tcap{text-align:center;padding:8px 6px 12px;line-height:1.12}
.tcap b{display:block;font-family:'Noto Sans KR';font-weight:900;font-size:31px;color:#151515;letter-spacing:-1.5px}
.tcap em{display:block;font-style:normal;font-family:'Noto Sans KR';font-weight:900;font-size:31px;color:#e5262f;letter-spacing:-1.5px}
</style></head><body>
${bg}
${hero}
<svg class="pen" width="300" height="60" viewBox="0 0 300 60"><rect x="0" y="14" width="210" height="34" rx="10" fill="#ffd400" stroke="#333" stroke-width="3"/><rect x="200" y="14" width="60" height="34" rx="6" fill="#444"/><path d="M260 18 L296 31 L260 44Z" fill="#222"/><rect x="20" y="22" width="120" height="8" rx="4" fill="#fff" opacity=".6"/></svg>
<div class="note"><ul>${note}</ul></div>
${title(spec.title ?? [])}
${banner(spec.banner ?? "")}
<svg class="spark" width="120" height="120" viewBox="0 0 120 120"><g stroke="#ffd400" stroke-width="13" stroke-linecap="round"><path d="M20 70 L48 30"/><path d="M40 92 L96 62"/><path d="M58 18 L74 6" /></g></svg>
<div class="tiles">${tiles}</div>
</body></html>`;
}

// 제목·배너가 영역보다 길면 글자 크기를 줄여 맞춘다 (폰트 로드 후 실행)
function fitText() {
  for (const el of document.querySelectorAll(".tline")) {
    const max = +el.dataset.max;
    let fs = +el.getAttribute("font-size");
    while (el.getComputedTextLength() > max && fs > 60) { fs -= 4; el.setAttribute("font-size", fs); }
  }
  const bt = document.getElementById("btext");
  let bfs = +bt.getAttribute("font-size");
  while (bt.getComputedTextLength() > 560 && bfs > 30) { bfs -= 2; bt.setAttribute("font-size", bfs); }
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
  let bgUrl = null;
  if (spec.bg) {
    const p = resolve(dir, spec.bg);
    const mime = extname(p).toLowerCase() === ".png" ? "image/png" : "image/jpeg";
    bgUrl = `data:${mime};base64,${readFileSync(p).toString("base64")}`;
  }
  const html = buildHtml(spec, bgUrl);
  writeFileSync(join(dir, "thumb.preview.html"), html);
  await page.setContent(html, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(fitText);
  await page.screenshot({ path: join(dir, "thumb.png") });
  console.log("rendered", join(dir, "thumb.png"));
}
await browser.close();
