// 글 소스(source.md + meta.json) → 네이버 복붙용 post.html (글 폴더마다)
//                                 + 발행메모_<날짜>.txt (날짜 폴더에 1개: 글별 제목 3안·태그·발행 전 체크)
// 사용법: node blog/tools/build-post.mjs blog/posts/<블로그키>/<날짜> [--only 04,05,06]
//         (--only: 같은 날 두 번째 실행처럼 일부 글만 빌드하고 발행메모에도 그 글만 넣을 때)
//
// post.html 은 열자마자 Ctrl+A → Ctrl+C 로 통째로 붙여넣는 용도라 안내문·사진 자리 표시를 넣지 않는다.
// 네이버 스마트에디터는 div 배경·둥근 모서리를 버리므로 강조/정리 박스는 표(table)로 만든다.
//
// source.md 문법 (네이버 스마트에디터에 붙여도 깨지지 않는 것만 지원)
//   ## 소제목             → 색 막대 소제목
//   빈 줄                 → 문단 구분, 문단 안 줄바꿈은 그대로 유지
//   - 항목                → 목록
//   | a | b |             → 표 (첫 줄 = 머리글, |---| 줄은 무시)
//   :::box ... :::        → 강조 박스 (1칸 표)
//   :::summary 제목 ... ::: → 정리 표 (머리글 + 항목별 1줄)
//   [사진] 설명           → 무시 (예전 소스 호환용)
//   ※ 문장               → 작은 회색 글씨(출처·기준일)
//   **굵게**
import { readdirSync, readFileSync, existsSync, writeFileSync, rmSync } from "node:fs";
import { join, resolve, basename } from "node:path";

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

const esc = (s) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]);
const inline = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
const plain = (s) => s.replace(/\*\*(.+?)\*\*/g, "$1");

function parse(src) {
  const blocks = [];
  const lines = src.replace(/\r/g, "").split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    if (line.startsWith(":::")) {
      const [kind, ...rest] = line.slice(3).trim().split(" ");
      const body = [];
      while (++i < lines.length && lines[i].trim() !== ":::") body.push(lines[i]);
      blocks.push({ type: kind, title: rest.join(" "), body });
    } else if (line.startsWith("## ")) blocks.push({ type: "h2", text: line.slice(3) });
    else if (line.startsWith("[사진]")) blocks.push({ type: "photo", text: line.slice(4).trim() });
    else if (line.startsWith("※")) blocks.push({ type: "note", text: line });
    else if (line.startsWith("|")) {
      const rows = [];
      for (; i < lines.length && lines[i].startsWith("|"); i++)
        if (!/^\|\s*-/.test(lines[i])) rows.push(lines[i].split("|").slice(1, -1).map((c) => c.trim()));
      i--;
      blocks.push({ type: "table", rows });
    } else if (line.startsWith("- ")) {
      const items = [];
      for (; i < lines.length && lines[i].startsWith("- "); i++) items.push(lines[i].slice(2));
      i--;
      blocks.push({ type: "ul", items });
    } else {
      const para = [];
      for (; i < lines.length && lines[i].trim() && !/^(##|:::|\[사진\]|※|\||- )/.test(lines[i]); i++) para.push(lines[i]);
      i--;
      blocks.push({ type: "p", lines: para });
    }
  }
  return blocks;
}

function toHtml(blocks, meta) {
  const c = COLORS[meta.theme] ?? COLORS.scholarship;
  const a = ACCENTS[meta.theme] ?? ACCENTS.scholarship;
  const td = "padding:12px;border:1px solid #ddd;";
  const out = blocks.map((b) => {
    switch (b.type) {
      case "h2":
        return `<p><br></p>\n<h2 style="font-size:22px;border-left:6px solid ${c};padding-left:12px;margin:32px 0 16px;">${inline(b.text)}</h2>`;
      case "p":
        return `<p>${b.lines.map(inline).join("<br>\n")}</p>`;
      case "ul":
        return `<ul>\n${b.items.map((t) => `<li>${inline(t)}</li>`).join("\n")}\n</ul>`;
      case "photo":
        return "";
      case "note":
        return `<p style="font-size:13px;color:#888;">${inline(b.text)}</p>`;
      case "table": {
        const [head, ...rows] = b.rows;
        return `<table style="width:100%;border-collapse:collapse;text-align:center;font-size:15px;">
<tr style="background:${c};color:#fff;">${head.map((h) => `<th style="padding:12px;border:1px solid ${c};">${inline(h)}</th>`).join("")}</tr>
${rows.map((r, i) => `<tr${i % 2 ? ' style="background:#fafafa;"' : ""}>${r.map((x) => `<td style="${td}">${inline(x)}</td>`).join("")}</tr>`).join("\n")}
</table>`;
      }
      case "box":
        return `<table style="width:100%;border-collapse:collapse;font-size:16px;">
<tr><td style="padding:16px 18px;border:2px solid ${a};background:#fffbe6;line-height:1.8;">${b.body.filter(Boolean).map(inline).join("<br>\n")}</td></tr>
</table>`;
      case "summary": {
        const items = b.body.filter(Boolean).map((l) => l.replace(/^[·\-]\s*/, ""));
        return `<p><br></p>
<table style="width:100%;border-collapse:collapse;font-size:16px;">
<tr style="background:${c};color:#fff;"><th style="padding:12px;border:1px solid ${c};text-align:left;">✔ ${esc(b.title || "정리하면")}</th></tr>
${items.map((t, i) => `<tr${i % 2 ? ' style="background:#fafafa;"' : ""}><td style="${td}text-align:left;">${i + 1}. ${inline(t)}</td></tr>`).join("\n")}
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

function toText(blocks) {
  return blocks
    .map((b) => {
      switch (b.type) {
        case "h2":
          return `▶ ${plain(b.text)}`;
        case "p":
          return b.lines.map(plain).join("\n");
        case "ul":
          return b.items.map((t) => `· ${plain(t)}`).join("\n");
        case "photo":
          return `(사진: ${b.text})`;
        case "note":
          return plain(b.text);
        case "table": {
          const [head, ...rows] = b.rows;
          return [`[${head.join(" | ")}]`, ...rows.map((r) => `· ${r.map(plain).join(" | ")}`)].join("\n");
        }
        case "box":
          return b.body.filter(Boolean).map(plain).join("\n");
        case "summary":
          return `▶ ${b.title || "정리하면"}\n${b.body.filter(Boolean).map(plain).join("\n")}`;
        default:
          return "";
      }
    })
    .join("\n\n");
}

// 날짜 폴더에 하나: 글별 제목 3안(추천 표시) + 태그 + 짧은 발행 전 체크
function toDailyMemo(date, posts) {
  const kinds = ["검색형", "궁금증형", "인간형"];
  const parts = posts.map(({ name, meta }) => {
    const pickIdx = "ABC".indexOf((meta.pick ?? "").trim()[0]);
    const titles = meta.titles.map((t, i) => `  ${i + 1}) ${t}  (${kinds[i]})${i === pickIdx ? "  ★추천" : ""}`).join("\n");
    const checks = (meta.check ?? meta.checklist ?? []).slice(0, 2).map((c) => `  - ${c}`).join("\n");
    return `[${name}]
카테고리: ${meta.category}
제목
${titles}
태그
  ${meta.tags.map((t) => `#${t}`).join(" ")}${checks ? `\n발행 전 체크\n${checks}` : ""}`;
  });
  return `${date} 발행메모\n\n${parts.join("\n\n" + "-".repeat(40) + "\n\n")}\n`;
}

const root = resolve(process.argv[2] ?? ".");
const onlyIdx = process.argv.indexOf("--only");
const only = onlyIdx > 0 ? process.argv[onlyIdx + 1].split(",") : null;
const dirs = readdirSync(root, { withFileTypes: true })
  .filter((d) => d.isDirectory() && existsSync(join(root, d.name, "source.md")))
  .filter((d) => !only || only.some((n) => d.name.startsWith(n + "-")))
  .map((d) => join(root, d.name))
  .sort();

// 주제가 여러 개인 블로그(blogs.json 의 categoryInFilename)는 HTML 파일 이름에 세부주제를 넣는다
// 예: "[경제] 01-10월-금통위-기준금리.html"
const blogKey = basename(resolve(root, ".."));
const blogsPath = resolve(root, "../../../blogs.json");
const blogConf = existsSync(blogsPath) ? (JSON.parse(readFileSync(blogsPath, "utf8"))[blogKey] ?? {}) : {};
const htmlName = (dir, meta) => (blogConf.categoryInFilename ? `[${meta.category}] ${basename(dir)}.html` : "post.html");

const posts = [];
for (const dir of dirs) {
  const meta = JSON.parse(readFileSync(join(dir, "meta.json"), "utf8"));
  if (blogConf.categories && !blogConf.categories.includes(meta.category))
    console.warn(`! ${basename(dir)}: category "${meta.category}" 가 blogs.json 목록(${blogConf.categories.join("/")})에 없음`);
  const blocks = parse(readFileSync(join(dir, "source.md"), "utf8"));
  for (const f of readdirSync(dir)) if (f.endsWith(".html") && !f.startsWith("thumb")) rmSync(join(dir, f)); // 이전 이름 정리
  writeFileSync(join(dir, htmlName(dir, meta)), toHtml(blocks, meta));
  rmSync(join(dir, "발행메모.txt"), { force: true }); // 예전 형식 정리
  posts.push({ name: basename(dir), meta });
  const chars = toText(blocks).replace(/\s/g, "").length;
  console.log(`built ${dir}  (본문 ${chars}자, 공백 제외)`);
}
const date = basename(root);
writeFileSync(join(root, `발행메모_${date}.txt`), toDailyMemo(date, posts));
console.log(`memo  ${join(root, `발행메모_${date}.txt`)}`);
