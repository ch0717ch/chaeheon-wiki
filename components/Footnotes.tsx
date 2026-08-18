import type { ReactNode } from "react";
import { splitFootnotes, type FootnoteRegistry } from "@/lib/footnotes";

/**
 * 텍스트 한 덩어리를 렌더하면서 [*각주] 를 위첨자 [n] 으로 바꾼다.
 * registry 가 없으면 각주 문법을 그냥 지우고 본문만 보여준다.
 */
export function FnText({
  text,
  registry,
}: {
  text: string;
  registry?: FootnoteRegistry;
}): ReactNode {
  const parts = splitFootnotes(text);
  if (parts.length === 1 && parts[0].kind === "text") return parts[0].value;

  return (
    <>
      {parts.map((p, i) => {
        if (p.kind === "text") return <span key={i}>{p.value}</span>;
        if (!registry) return null;
        const n = registry.add(p.value);
        return (
          <sup key={i} id={`fnref-${n}`} className="fn-ref">
            <a href={`#fn-${n}`} title={p.value} aria-label={`각주 ${n}: ${p.value}`}>
              [{n}]
            </a>
          </sup>
        );
      })}
    </>
  );
}

/**
 * 문서 하단 각주 목록. 나무위키처럼 [n] 을 누르면 본문 위치로 돌아간다.
 * 등록된 각주가 없으면 아무것도 그리지 않는다.
 */
export function FootnoteList({ registry }: { registry: FootnoteRegistry }) {
  const notes = registry.all();
  if (!notes.length) return null;

  return (
    <section aria-labelledby="footnotes-heading" className="mt-14">
      <h2
        id="footnotes-heading"
        className="rule-heavy pt-3 text-base font-bold tracking-tight text-ink"
      >
        각주
      </h2>
      <ol className="mt-3 max-w-prose space-y-1.5 text-sm leading-relaxed">
        {notes.map((note) => (
          <li key={note.n} id={`fn-${note.n}`} className="grid grid-cols-[2.25rem_1fr] scroll-mt-24">
            <a
              href={`#fnref-${note.n}`}
              className="fn-ref-back font-mono text-ink"
              aria-label={`본문의 각주 ${note.n} 위치로`}
            >
              [{note.n}]
            </a>
            <span className="text-ink-soft">{note.text}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
