import type { ReactNode } from "react";
import { toParagraphs } from "@/lib/format";

/** DB 의 긴 텍스트를 문단 단위로 나눠 렌더한다. 비어 있으면 아무것도 그리지 않는다. */
export function Paragraphs({ text, className = "" }: { text: string; className?: string }) {
  const paragraphs = toParagraphs(text);
  if (!paragraphs.length) return null;

  return (
    <div className={`max-w-prose space-y-4 leading-[1.85] text-ink-soft ${className}`}>
      {paragraphs.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </div>
  );
}

/** 불릿 목록. 위키처럼 들여쓰기 대신 얇은 세로선으로 계층을 표시한다. */
export function Bullets({ items }: { items: string[] }) {
  if (!items.length) return null;

  return (
    <ul className="max-w-prose space-y-3">
      {items.map((item, i) => (
        <li
          key={i}
          className="border-l-2 border-line pl-4 leading-[1.85] text-ink-soft"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

/** 번호가 의미를 갖는 목록(연구 질문 등)에 쓴다. */
export function NumberedList({ items }: { items: string[] }) {
  if (!items.length) return null;

  return (
    <ol className="max-w-prose space-y-3">
      {items.map((item, i) => (
        <li key={i} className="grid grid-cols-[1.75rem_1fr] items-baseline">
          <span className="sec-num">{i + 1}.</span>
          <span className="leading-[1.85] text-ink-soft">{item}</span>
        </li>
      ))}
    </ol>
  );
}

/** 키워드·기술 스택용 태그. 색을 쓰지 않고 테두리로만 구분한다. */
export function TagList({ items, label }: { items: string[]; label?: string }) {
  if (!items.length) return null;

  return (
    <ul aria-label={label} className="flex flex-wrap gap-2">
      {items.map((item) => (
        <li
          key={item}
          className="border border-line px-2.5 py-1 text-[0.8125rem] leading-5 text-ink-soft"
        >
          {item}
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
