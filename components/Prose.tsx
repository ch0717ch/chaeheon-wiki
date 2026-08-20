import type { ReactNode } from "react";
import { FnText } from "@/components/Footnotes";
import YouTubeEmbed, { extractYouTubeId } from "@/components/YouTubeEmbed";
import type { FootnoteRegistry } from "@/lib/footnotes";
import { toParagraphs } from "@/lib/format";

// 본문을 그리는 컴포넌트들은 선택적으로 각주 레지스트리를 받는다.
// 넘기면 [*각주] 문법이 살아나고, 안 넘기면 문법이 조용히 지워진다.

/**
 * 문단 하나를 텍스트 덩어리와 유튜브 임베드로 나눈다.
 * 유튜브 링크만 있는 줄은 임베드가 되고, 나머지 줄은 이어 붙는다.
 */
function paragraphBlocks(p: string): Array<{ kind: "text" | "yt"; value: string }> {
  const blocks: Array<{ kind: "text" | "yt"; value: string }> = [];
  for (const line of p.split("\n")) {
    const id = extractYouTubeId(line);
    if (id) {
      blocks.push({ kind: "yt", value: id });
    } else if (blocks.length && blocks[blocks.length - 1].kind === "text") {
      blocks[blocks.length - 1].value += "\n" + line;
    } else {
      blocks.push({ kind: "text", value: line });
    }
  }
  return blocks.filter((b) => b.kind === "yt" || b.value.trim());
}

/** DB 의 긴 텍스트를 문단 단위로 나눠 렌더한다. 비어 있으면 아무것도 그리지 않는다. */
export function Paragraphs({
  text,
  className = "",
  fn,
}: {
  text: string;
  className?: string;
  fn?: FootnoteRegistry;
}) {
  const paragraphs = toParagraphs(text);
  if (!paragraphs.length) return null;

  return (
    <div className={`max-w-prose space-y-4 leading-[1.85] text-ink-soft ${className}`}>
      {paragraphs.map((p, i) =>
        paragraphBlocks(p).map((block, j) =>
          block.kind === "yt" ? (
            <YouTubeEmbed key={`${i}-${j}`} id={block.value} />
          ) : (
            // whitespace-pre-line: 문단 안의 한 줄 개행(Enter)을 그대로 보여준다.
            // (빈 줄은 위의 toParagraphs 가 문단 나눔으로 처리한다)
            <p key={`${i}-${j}`} className="whitespace-pre-line">
              <FnText text={block.value} registry={fn} />
            </p>
          ),
        ),
      )}
    </div>
  );
}

/**
 * 불릿 목록. 위키처럼 들여쓰기 대신 얇은 세로선으로 계층을 표시한다.
 * 항목이 통째로 유튜브 링크면 그 자리에 플레이어를 띄운다 —
 * 곡 목록처럼 "제목 한 줄, 링크 한 줄" 로 쓰는 경우를 위해서다.
 */
export function Bullets({ items, fn }: { items: string[]; fn?: FootnoteRegistry }) {
  if (!items.length) return null;

  return (
    <ul className="max-w-prose space-y-3">
      {items.map((item, i) => {
        const yt = extractYouTubeId(item);
        return (
          <li key={i} className="border-l-2 border-line pl-4 leading-[1.85] text-ink-soft">
            {yt ? <YouTubeEmbed id={yt} /> : <FnText text={item} registry={fn} />}
          </li>
        );
      })}
    </ul>
  );
}

/** 번호가 의미를 갖는 목록(연구 질문 등)에 쓴다. */
export function NumberedList({ items, fn }: { items: string[]; fn?: FootnoteRegistry }) {
  if (!items.length) return null;

  return (
    <ol className="max-w-prose space-y-3">
      {items.map((item, i) => (
        <li key={i} className="grid grid-cols-[1.75rem_1fr] items-baseline">
          <span className="sec-num">{i + 1}.</span>
          <span className="leading-[1.85] text-ink-soft">
            <FnText text={item} registry={fn} />
          </span>
        </li>
      ))}
    </ol>
  );
}

/** 키워드·기술 스택용 태그. 색을 쓰지 않고 테두리로만 구분한다. */
export function TagList({
  items,
  label,
  fn,
}: {
  items: string[];
  label?: string;
  fn?: FootnoteRegistry;
}) {
  if (!items.length) return null;

  return (
    <ul aria-label={label} className="flex flex-wrap gap-2">
      {items.map((item) => (
        <li
          key={item}
          className="border border-line px-2.5 py-1 text-[0.8125rem] leading-5 text-ink-soft"
        >
          <FnText text={item} registry={fn} />
        </li>
      ))}
    </ul>
  );
}

/** 내용이 아직 없는 섹션에 쓰는 안내. 빈 화면을 그냥 두지 않는다. */
export function EmptyNotice({ children }: { children: ReactNode }) {
  return (
    <p className="max-w-prose border border-dashed border-line px-4 py-6 text-sm leading-relaxed text-ink-muted">
      {children}
    </p>
  );
}
