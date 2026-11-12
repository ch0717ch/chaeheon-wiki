// 규칙 v2 (blog/strategy/rules-v2.md) 배치 빌더
// 사용법: node blog/tools/build-batch.mjs blog/posts/<블로그키>/<날짜> [--only 11,12]
//         (--only: 같은 날짜 폴더에 이전 형식 글이 섞여 있을 때 이번 배치 글 번호만 빌드)
//
// 날짜 폴더 안의 글 폴더(NN-slug/source.md + meta.json)를 읽어
//   <날짜폴더>/배치_YYYYMMDD_<블로그명>/
//     NN_키워드(카테고리).html      ← 네이버 에디터 복붙용 본문 (안내문·자리 표시 없음)
//     배치정보.md                   ← 글별 제목 3안·해시태그 30·카테고리·예약 시각·모드·도입/마무리 유형·쇼핑커넥트 + 검수 결과
//     NN_키워드(카테고리)_썸네일.png ← 글 폴더의 thumb.png(render-thumbs.mjs 잡지 표지형)를 이 이름으로 복사
// 를 만들고, 배치 전체를 자동 검수해 문제를 출력한다. 순서: render-thumbs.mjs → build-batch.mjs → pack-batch.py
// 썸네일·본문 디자인은 이전 형식 그대로(사용자 지시 2026-11-12), 바뀐 것은 글 형태와 결과물 구성뿐.
//
// source.md 문법 (네이버 스마트에디터에 붙여도 깨지지 않는 것만)
//   ## 소제목                 → 색 막대 소제목
//   빈 줄                     → 문단 구분 (문단 안 줄바꿈 유지)
//   - 항목 / 1. 항목          → 글머리 목록 / 번호 목록  (- [ ] 항목 → ☐ 체크리스트)
//   | a | b |                 → 표 (첫 줄 = 머리글, |---| 줄은 무시)
//   > 문장                    → 인용구 (연속된 > 줄은 한 인용구)
//   ---                       → 구분선
//   :::box ... :::            → 강조 박스 (1칸 표)
//   :::summary 제목 ... :::   → 요약 표 (제목 필수, "정리하면" 금지)
//   **굵게**   ==형광펜==   [링크 글자](https://공식주소)
//   **Q. 질문**  다음 줄 답    → 자주 묻는 질문
//   ※ 문장                    → 작은 회색 글씨(기준일·출처)
//
// meta.json 키 (v2)
//   no, keyword, category(blogs.json 의 v2Categories), theme, mode("일반"|"시리즈"), seriesOf(시리즈 원글 제목),
//   intro(질문형|상황 묘사형|뉴스 맥락형|결론 먼저형|비교표 먼저형),
//   outro(체크리스트|다음 행동 제안|주의사항 한 줄|질문 던지기|일정 리마인드|짧게 끝내기),
//   titles[3], hashtags[30](# 없이), shoppingConnect(선택), schedule(선택 "HH:MM"), sources[]
//   theme 은 blogs.json themes (scholarship|volunteer|activity / economy|finance|society / game|ai|it) — 본문 색·썸네일 색
import { readdirSync, readFileSync, existsSync, writeFileSync, mkdirSync, rmSync, copyFileSync } from "node:fs";
import { join, resolve, basename } from "node:path";

export const INTROS = ["질문형", "상황 묘사형", "뉴스 맥락형", "결론 먼저형", "비교표 먼저형"];
export const OUTROS = ["체크리스트", "다음 행동 제안", "주의사항 한 줄", "질문 던지기", "일정 리마인드", "짧게 끝내기"];
const FORBIDDEN = [
  [/정리하면/, "정리하면"],
  [/정리했습니다/, "정리했습니다"],
  [/알아보겠습니다/, "~알아보겠습니다"],
  [/알아볼게요/, "~알아볼게요"],
  [/결론적으로/, "결론적으로"],
  [/오늘은\s?.{0,20}에 대해/, "오늘은 ~에 대해"],
  [/함께 보면 좋은/, "함께 보면 좋은 글"],
  [/\[사진\]/, "[사진] 자리 표시"],
];
const CONNECTORS = ["또한", "그리고", "따라서"];

// 본문 디자인은 이전 형식(build-post.mjs)과 같은 테마 색을 쓴다 (meta.theme)
const COLORS = {
  scholarship: "#0b1f44", volunteer: "#0b3d2e", activity: "#3a0d1e",
  economy: "#0a3a25", finance: "#0b1f44", society: "#2b1650",
  game: "#24103d", ai: "#08332f", it: "#0f172a",
};
const ACCENTS = {
  scholarship: "#ffd400", volunteer: "#c6ff3d", activity: "#ff8a3d",
  economy: "#2bb673", finance: "#ffd400", society: "#b18cff",
  game: "#c77dff", ai: "#2dd4bf", it: "#94a3b8",
};
const color = (meta) => COLORS[meta.theme] ?? COLORS.scholarship;
const accent = (meta) => ACCENTS[meta.theme] ?? ACCENTS.scholarship;

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
function inline(s, accent) {
  return esc(s)
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, (_, t, u) => `<a href="${u}" target="_blank" style="color:${accent};text-decoration:underline;">${t}</a>`)
    .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
    .replace(/==(.+?)==/g, `<span style="background:#fff3a8;">$1</span>`);
}
const plain = (s) => s.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, "$1").replace(/\*\*(.+?)\*\*/g, "$1").replace(/==(.+?)==/g, "$1");

export function parse(src) {
  const blocks = [];
  const lines = src.replace(/\r/g, "").split("\n");
  const special = /^(## |:::|※|\||- |\d+\. |> |---\s*$)/;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    if (line.startsWith(":::")) {
      const [kind, ...rest] = line.slice(3).trim().split(" ");
      const body = [];
      while (++i < lines.length && lines[i].trim() !== ":::") body.push(lines[i]);
      blocks.push({ type: kind, title: rest.join(" "), body });
    } else if (/^---\s*$/.test(line)) blocks.push({ type: "hr" });
    else if (line.startsWith("## ")) blocks.push({ type: "h2", text: line.slice(3) });
    else if (line.startsWith("※")) blocks.push({ type: "note", text: line });
    else if (line.startsWith("|")) {
      const rows = [];
      for (; i < lines.length && lines[i].startsWith("|"); i++)
        if (!/^\|\s*:?-/.test(lines[i])) rows.push(lines[i].split("|").slice(1, -1).map((c) => c.trim()));
      i--;
      blocks.push({ type: "table", rows });
    } else if (line.startsWith("> ")) {
      const items = [];
      for (; i < lines.length && lines[i].startsWith("> "); i++) items.push(lines[i].slice(2));
      i--;
      blocks.push({ type: "quote", items });
    } else if (line.startsWith("- ")) {
      const items = [];
      for (; i < lines.length && lines[i].startsWith("- "); i++) items.push(lines[i].slice(2));
      i--;
      blocks.push({ type: "ul", items });
    } else if (/^\d+\. /.test(line)) {
      const items = [];
      for (; i < lines.length && /^\d+\. /.test(lines[i]); i++) items.push(lines[i].replace(/^\d+\. /, ""));
      i--;
      blocks.push({ type: "ol", items });
    } else {
      const para = [];
      for (; i < lines.length && lines[i].trim() && !special.test(lines[i]); i++) para.push(lines[i]);
      i--;
      blocks.push({ type: "p", lines: para });
    }
  }
  return blocks;
}

export function toHtml(blocks, meta) {
  const c = color(meta);
  const il = (s) => inline(s, c);
  const td = "padding:12px;border:1px solid #ddd;";
  const out = blocks.map((b) => {
    switch (b.type) {
      case "h2":
        return `<p><br></p>\n<h2 style="font-size:22px;border-left:6px solid ${c};padding-left:12px;margin:32px 0 16px;">${il(b.text)}</h2>`;
      case "p": {
        const m = b.lines[0].match(/^\*\*(Q\..+?)\*\*$/);
        if (m) return `<p><b style="color:${c};">${esc(m[1])}</b><br>\n${b.lines.slice(1).map(il).join("<br>\n")}</p>`;
        return `<p>${b.lines.map(il).join("<br>\n")}</p>`;
      }
      case "ul":
        {
        const check = b.items.every((t) => /^\[ ?\]/.test(t));
        return `<ul${check ? ' style="list-style:none;padding-left:4px;"' : ""}>\n${b.items.map((t) => `<li>${il(t.replace(/^\[ ?\]\s*/, "☐ "))}</li>`).join("\n")}\n</ul>`;
      }
      case "ol":
        return `<ol>\n${b.items.map((t) => `<li>${il(t)}</li>`).join("\n")}\n</ol>`;
      case "hr":
        return `<hr style="border:0;border-top:1px solid #ddd;margin:28px 0;">`;
      case "quote":
        return `<blockquote style="margin:20px 0;padding:14px 18px;border-left:4px solid ${accent(meta)};background:#f7f7f9;color:#333;">${b.items.map(il).join("<br>\n")}</blockquote>`;
      case "note":
        return `<p style="font-size:13px;color:#888;">${il(b.text)}</p>`;
      case "table": {
        const [head, ...rows] = b.rows;
        return `<table style="width:100%;border-collapse:collapse;text-align:center;font-size:15px;">
<tr style="background:${c};color:#fff;">${head.map((h) => `<th style="padding:12px;border:1px solid ${c};">${il(h)}</th>`).join("")}</tr>
${rows.map((r, i) => `<tr${i % 2 ? ' style="background:#fafafa;"' : ""}>${r.map((x) => `<td style="${td}">${il(x)}</td>`).join("")}</tr>`).join("\n")}
</table>`;
      }
      case "box":
        return `<table style="width:100%;border-collapse:collapse;font-size:16px;">
<tr><td style="padding:16px 18px;border:2px solid ${accent(meta)};background:#fffbe6;line-height:1.8;">${b.body.filter(Boolean).map(il).join("<br>\n")}</td></tr>
</table>`;
      case "summary": {
        const items = b.body.filter(Boolean).map((l) => l.replace(/^[·\-]\s*/, ""));
        return `<p><br></p>
<table style="width:100%;border-collapse:collapse;font-size:16px;">
<tr style="background:${c};color:#fff;"><th style="padding:12px;border:1px solid ${c};text-align:left;">✔ ${esc(b.title)}</th></tr>
${items.map((t, i) => `<tr${i % 2 ? ' style="background:#fafafa;"' : ""}><td style="${td}text-align:left;">${i + 1}. ${il(t)}</td></tr>`).join("\n")}
</table>`;
      }
      default:
        return "";
    }
  });
  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(meta.titles[0])}</title>
</head>
<body style="margin:0;background:#fff;">
<div style="max-width:720px;margin:0 auto;padding:24px 16px;color:#222;font-size:16px;line-height:1.9;word-break:keep-all;font-family:'Noto Sans KR','Malgun Gothic',sans-serif;">
${out.filter(Boolean).join("\n\n")}
</div>
</body>
</html>
`;
}

export function toText(blocks) {
  return blocks
    .map((b) => {
      switch (b.type) {
        case "h2": return plain(b.text);
        case "p": return b.lines.map(plain).join("\n");
        case "ul": case "ol": case "quote": return b.items.map(plain).join("\n");
        case "note": return plain(b.text);
        case "table": return b.rows.map((r) => r.map(plain).join(" ")).join("\n");
        case "box": return b.body.filter(Boolean).map(plain).join("\n");
        case "summary": return [b.title, ...b.body.filter(Boolean).map(plain)].join("\n");
        default: return "";
      }
    })
    .filter(Boolean)
    .join("\n");
}

const safe = (s) => String(s).replace(/[\\/:*?"<>|]/g, "").trim();
export const fileBase = (meta) => `${meta.no}_${safe(meta.keyword)}(${meta.category})`;

function hhmm(min) {
  const h = Math.floor(min / 60) % 24, m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function titleEnding(t) {
  if (/정리해봤어요\s*$/.test(t)) return "정리해봤어요";
  if (/확인하세요\s*$/.test(t)) return "확인하세요";
  if (/[?？]\s*$/.test(t)) return "질문형";
  if (/입니다\s*$/.test(t)) return "입니다";
  return "기타";
}

// ───────────────────────── 실행 ─────────────────────────
const root = resolve(process.argv[2] ?? ".");
const date = basename(root);
const key = basename(resolve(root, ".."));
const blogs = JSON.parse(readFileSync(resolve(root, "../../../blogs.json"), "utf8"));
const conf = blogs[key];
if (!conf?.batchName) throw new Error(`blogs.json 에 ${key}.batchName 이 없음`);
const ymd = date.replace(/-/g, "");
const batchDir = join(root, `배치_${ymd}_${conf.batchName}`);
mkdirSync(batchDir, { recursive: true });
for (const f of readdirSync(batchDir)) if (f.endsWith(".html") || f.endsWith(".png") || f === "배치정보.md") rmSync(join(batchDir, f));

const onlyIdx = process.argv.indexOf("--only");
const only = onlyIdx > 0 ? process.argv[onlyIdx + 1].split(",") : null;
const dirs = readdirSync(root, { withFileTypes: true })
  .filter((d) => d.isDirectory() && existsSync(join(root, d.name, "source.md")))
  .filter((d) => !only || only.some((n) => d.name.startsWith(n + "-")))
  .map((d) => join(root, d.name))
  .sort();

const issues = []; // [글번호|배치, 내용]
const posts = [];
for (const [idx, dir] of dirs.entries()) {
  const meta = JSON.parse(readFileSync(join(dir, "meta.json"), "utf8"));
  const src = readFileSync(join(dir, "source.md"), "utf8");
  const blocks = parse(src);
  const html = toHtml(blocks, meta);
  const text = toText(blocks);
  const chars = text.replace(/\n/g, "").length;
  const n = meta.no;
  const warn = (m) => issues.push([n, m]);

  // 필수 키
  if (!conf.v2Categories.includes(meta.category)) warn(`카테고리 "${meta.category}" 가 ${conf.v2Categories.join("/")} 에 없음`);
  if (!INTROS.includes(meta.intro)) warn(`도입 유형 "${meta.intro}" 이 목록에 없음`);
  if (!OUTROS.includes(meta.outro)) warn(`마무리 유형 "${meta.outro}" 이 목록에 없음`);
  if (meta.titles?.length !== 3) warn(`제목 후보가 3개가 아님`);
  const tags = (meta.hashtags ?? []).map((t) => t.replace(/^#/, "").trim());
  if (tags.length !== 30) warn(`해시태그 ${tags.length}개 (30개 필요)`);
  if (new Set(tags).size !== tags.length) warn(`해시태그 중복 있음`);
  if (!existsSync(join(dir, "thumb.json"))) warn(`thumb.json 없음 (썸네일)`);
  if (!existsSync(join(dir, "thumb.png"))) warn(`thumb.png 없음 — render-thumbs.mjs 를 먼저 실행`);
  else copyFileSync(join(dir, "thumb.png"), join(batchDir, `${fileBase(meta)}_썸네일.png`));
  if (!COLORS[meta.theme]) warn(`theme "${meta.theme}" 이 없음 (blogs.json themes)`);
  if (meta.mode === "시리즈" && !meta.seriesOf) warn(`시리즈 모드인데 seriesOf(원글 제목) 없음`);
  if (blocks.some((b) => b.type === "summary" && (!b.title || /정리/.test(b.title)))) warn(`요약 표 제목이 비었거나 "정리" 포함`);

  // 본문 검수
  if (chars < 1500) warn(`본문 ${chars}자 (공백 포함 1,500자 이상 필요)`);
  for (const [re, label] of FORBIDDEN) if (re.test(src) || meta.titles.some((t) => re.test(t))) warn(`금지 표현 "${label}"`);
  const first = blocks.find((b) => b.type === "p");
  if (first && /^.{1,25}(이)?란\s/.test(plain(first.lines[0]))) warn(`첫 문장이 사전식 정의("○○란 ~")`);
  for (const cn of CONNECTORS) {
    const cnt = (text.match(new RegExp(`(^|[\\s.])${cn}[ ,]`, "g")) ?? []).length;
    if (cnt >= 2) warn(`접속어 "${cn}" ${cnt}회 반복`);
  }
  const links = [...html.matchAll(/href="([^"]*)"/g)].map((m) => m[1]);
  if (links.some((u) => !/^https?:\/\/\S+\.\S+/.test(u))) warn(`빈 링크/잘못된 링크 있음`);
  if (links.length < 1 || links.length > 3) warn(`공식 출처 링크 ${links.length}개 (1~3개 필요)`);
  if (!blocks.some((b) => b.type === "table")) warn(`표 없음`);
  if (key === "biz" && !/계산|예시|비교/.test(src)) warn(`본진: 계산 예시·비교표 없음`);

  writeFileSync(join(batchDir, `${fileBase(meta)}.html`), html);
  posts.push({ dir, meta, tags, text, chars, links: links.length });
  console.log(`built ${fileBase(meta)}.html  (공백 포함 ${chars}자, 링크 ${links.length})`);
}

// 배치 단위 검수
const limit = Math.max(1, Math.ceil(posts.length * 0.3));
for (const kind of ["intro", "outro"]) {
  const label = kind === "intro" ? "도입" : "마무리";
  const counts = {};
  posts.forEach((p, i) => {
    const v = p.meta[kind];
    counts[v] = (counts[v] ?? 0) + 1;
    if (i > 0 && posts[i - 1].meta[kind] === v) issues.push([p.meta.no, `${label} 유형 "${v}" 이 바로 앞 글과 같음`]);
  });
  for (const [v, c] of Object.entries(counts)) if (c > limit) issues.push(["배치", `${label} 유형 "${v}" ${c}회 (최대 ${limit})`]);
}
const endings = posts.flatMap((p) => p.meta.titles.map(titleEnding));
const tidy = endings.filter((e) => e === "정리해봤어요").length;
if (tidy > 2) issues.push(["배치", `제목 어미 "정리해봤어요" ${tidy}개 (배치당 2개 이하)`]);
const kinds = new Set(endings.filter((e) => e !== "기타"));
if (kinds.size < 3) issues.push(["배치", `제목 어미 종류가 ${kinds.size}가지뿐 (확인하세요/입니다/질문형/정리해봤어요 섞기)`]);

// 같은 문장 틀이 3개 이상 글에서 반복되는지 (숫자·고유어 차이를 줄여 비교)
const norm = (s) => s.replace(/[0-9,.~%]+/g, "#").replace(/\s+/g, " ").trim();
const seen = new Map();
posts.forEach((p) => {
  const sents = new Set(
    p.text.split(/\n|(?<=[.?!요다])\s+/).map(norm).filter((s) => s.length >= 12 && !/^#/.test(s)),
  );
  for (const s of sents) seen.set(s, [...(seen.get(s) ?? []), p.meta.no]);
});
for (const [s, nos] of seen) if (nos.length >= 3) issues.push(["배치", `같은 문장 ${nos.length}개 글에서 반복 (${nos.join(", ")}): "${s.slice(0, 40)}"`]);

// 예약 발행 시각
const [sh, sm] = (blogs.scheduleStart ?? "07:00").split(":").map(Number);
const start = sh * 60 + sm + (conf.scheduleOffsetMin ?? 0);
const step = conf.scheduleIntervalMin ?? 60;
posts.forEach((p, i) => (p.time = p.meta.schedule ?? hhmm(start + i * step)));

// 배치정보.md
const lines = [`# 배치정보 — ${conf.batchName} (${date})`, ""];
lines.push(`| 번호 | 키워드 | 카테고리 | 예약 | 모드 | 도입 | 마무리 |`, `|---|---|---|---|---|---|---|`);
for (const p of posts)
  lines.push(`| ${p.meta.no} | ${p.meta.keyword} | ${p.meta.category} | ${p.time} | ${p.meta.mode ?? "일반"} | ${p.meta.intro} | ${p.meta.outro} |`);
lines.push("");
for (const p of posts) {
  const m = p.meta;
  lines.push(`---`, ``, `## ${fileBase(m)}`, ``);
  lines.push(`- 카테고리: ${m.category}`);
  lines.push(`- 예약 발행: ${date} ${p.time}`);
  lines.push(`- 모드: ${m.mode === "시리즈" ? `시리즈 (원글: ${m.seriesOf})` : "일반"}`);
  lines.push(`- 도입 유형: ${m.intro} / 마무리 유형: ${m.outro}`);
  if (m.shoppingConnect) lines.push(`- 쇼핑커넥트 위치: ${m.shoppingConnect}`);
  lines.push(`- 본문: 공백 포함 ${p.chars}자, 공식 링크 ${p.links}개`, ``, `**제목 후보**`, ``);
  m.titles.forEach((t, i) => lines.push(`${i + 1}. ${t}`));
  lines.push(``, `**해시태그 (${p.tags.length}개)**`, ``, p.tags.map((t) => `#${t}`).join(" "), ``);
}
lines.push(`---`, ``, `## 배치 검수 결과`, ``);
lines.push(`- 글 ${posts.length}개, 본문 공백 포함 ${Math.min(...posts.map((p) => p.chars))}~${Math.max(...posts.map((p) => p.chars))}자`);
const count = (k) => Object.entries(posts.reduce((a, p) => ((a[p.meta[k]] = (a[p.meta[k]] ?? 0) + 1), a), {})).map(([v, c]) => `${v} ${c}`).join(", ");
lines.push(`- 도입 유형: ${count("intro")}`);
lines.push(`- 마무리 유형: ${count("outro")}`);
lines.push(`- 제목 어미: ${Object.entries(endings.reduce((a, e) => ((a[e] = (a[e] ?? 0) + 1), a), {})).map(([v, c]) => `${v} ${c}`).join(", ")}`);
lines.push(`- 시리즈 모드: ${posts.filter((p) => p.meta.mode === "시리즈").length}/${posts.length}`);
lines.push(`- 금지 표현·빈 링크·반복 문장 검사: ${issues.length ? `${issues.length}건 남음` : "통과"}`);
for (const [n, m] of issues) lines.push(`  - [${n}] ${m}`);
writeFileSync(join(batchDir, "배치정보.md"), lines.join("\n") + "\n");

console.log(`info  ${join(batchDir, "배치정보.md")}`);
if (issues.length) {
  console.log(`\n검수 ${issues.length}건:`);
  for (const [n, m] of issues) console.log(`  [${n}] ${m}`);
  process.exitCode = 1;
} else console.log(`검수 통과`);
