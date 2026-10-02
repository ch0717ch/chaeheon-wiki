// 글 소스(source.md + meta.json) → 네이버 복붙용 post.html + 발행메모.txt
// 사용법: node blog/tools/build-post.mjs blog/posts/2026-10-02
//
// source.md 문법 (네이버 스마트에디터에 붙여도 깨지지 않는 것만 지원)
//   ## 소제목             → 색 막대 소제목
//   빈 줄                 → 문단 구분, 문단 안 줄바꿈은 그대로 유지
//   - 항목                → 목록
//   | a | b |             → 표 (첫 줄 = 머리글, |---| 줄은 무시)
//   :::box ... :::        → 노란 강조 박스
//   :::summary 제목 ... ::: → 진한 요약 박스
//   [사진] 설명           → 사진 넣을 자리 표시
//   ※ 문장               → 작은 회색 글씨(출처·기준일)
//   **굵게**
import { readdirSync, readFileSync, existsSync, writeFileSync } from "node:fs";
import { join, resolve, dirname, basename } from "node:path";

const COLORS = { scholarship: "#0b1f44", volunteer: "#0b3d2e", activity: "#3a0d1e" };
const ACCENTS = { scholarship: "#ffd400", volunteer: "#c6ff3d", activity: "#ff8a3d" };

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
        return `<p style="text-align:center;color:#888;font-size:14px;background:#f3f3f3;padding:28px 0;border-radius:8px;">[사진] ${esc(b.text)}</p>`;
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
        return `<div style="background:#fffbe6;border:2px solid ${a};border-radius:12px;padding:18px 20px;"><p style="margin:0;">${b.body.filter(Boolean).map(inline).join("<br>\n")}</p></div>`;
      case "summary":
        return `<p><br></p>\n<div style="background:${c};color:#fff;border-radius:12px;padding:20px;"><p style="margin:0 0 8px;font-weight:700;color:${a};">${esc(b.title || "정리하면")}</p><p style="margin:0;">${b.body.filter(Boolean).map(inline).join("<br>\n")}</p></div>`;
      default:
        return "";
    }
  });
  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(meta.slugTitle ?? meta.titles[0])} — 네이버 복붙용</title>
</head>
<body style="margin:0;background:#f4f5f7;">
<div style="max-width:720px;margin:0 auto;padding:24px 16px;font-family:'Noto Sans KR','Malgun Gothic',sans-serif;">
<div style="background:#e9ecf1;border-radius:10px;padding:14px 16px;font-size:13px;color:#555;margin-bottom:24px;line-height:1.7;">
<b>복붙 가이드</b> (이 회색 박스는 복사하지 마세요)<br>
1) 아래 흰 영역 첫 글자부터 끝까지 드래그 → 복사 → 네이버 스마트에디터 본문에 붙여넣기<br>
2) 회색 [사진] 자리에 사진 업로드 (첫 사진 = 같은 폴더 thumb.png, 대표 이미지 지정)<br>
3) 제목·태그는 발행메모.txt 에서 복사
</div>
<div style="background:#fff;padding:32px 24px;border-radius:12px;color:#222;font-size:16px;line-height:1.9;word-break:keep-all;">
${out.join("\n\n")}
</div>
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

function toMemo(meta, blocks, date) {
  const bar = "━".repeat(36);
  const labels = ["A. [검색형]  ", "B. [궁금증형]", "C. [인간형]  "];
  return `${bar}
[발행메모 ${meta.no}] ${date} · 카테고리: ${meta.category}
${bar}

■ 메인 키워드 : ${meta.keyword}
■ 서브 키워드 : ${meta.subKeywords.join(", ")}
■ 검색 의도  : ${meta.intent}
■ 차별 포인트 : ${meta.angle}

━━ 제목 추천 3안 ━━━━━━━━━━━━━━━━━━━
${meta.titles.map((t, i) => `${labels[i]} ${t}`).join("\n")}
→ 추천: ${meta.pick}

━━ 태그 (${meta.tags.length}개, 그대로 복사) ━━━━━━━━━━
${meta.tags.map((t) => `#${t}`).join(" ")}

━━ 사진 배치 ━━━━━━━━━━━━━━━━━━━━━━
${meta.photos.map((p, i) => `${i + 1}) ${p}`).join("\n")}

━━ 본문 (텍스트 버전 · 서식 없이 붙일 때) ━━━━━

${toText(blocks)}

━━ 발행 전 체크 ━━━━━━━━━━━━━━━━━━━
${meta.checklist.map((c) => `[ ] ${c}`).join("\n")}

━━ 참고 출처 ━━━━━━━━━━━━━━━━━━━━━━
${meta.sources.map((s) => `- ${s}`).join("\n")}
`;
}

const root = resolve(process.argv[2] ?? ".");
const dirs = existsSync(join(root, "source.md"))
  ? [root]
  : readdirSync(root, { withFileTypes: true })
      .filter((d) => d.isDirectory() && existsSync(join(root, d.name, "source.md")))
      .map((d) => join(root, d.name));

for (const dir of dirs) {
  const meta = JSON.parse(readFileSync(join(dir, "meta.json"), "utf8"));
  const blocks = parse(readFileSync(join(dir, "source.md"), "utf8"));
  writeFileSync(join(dir, "post.html"), toHtml(blocks, meta));
  writeFileSync(join(dir, "발행메모.txt"), toMemo(meta, blocks, meta.date ?? basename(dirname(dir))));
  const chars = toText(blocks).replace(/\s/g, "").length;
  console.log(`built ${dir}  (본문 ${chars}자, 공백 제외)`);
}
