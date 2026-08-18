import type { ReactNode } from "react";
import { splitFootnotes, type FootnoteRegistry } from "@/lib/footnotes";

/**
 * 말풍선. CSS 만으로 hover/focus 에 뜨므로 서버 컴포넌트에서 그대로 쓴다.
 * 터치 기기에서는 탭하면 포커스가 잡혀 같은 말풍선이 뜬다.
 */
function Tip({ text, children }: { text: string; children: ReactNode }) {
  return (
    <span className="fn-tip">
      {children}
      <span role="tooltip" className="fn-tip-bubble">
        {text}
      </span>
    </span>
  );
}

/**
 * 텍스트 한 덩어리를 렌더하면서 각주 문법을 바꾼다.
 *   [*내용]  → 위첨자 [n] + 말풍선. 클릭하면 하단 목록으로.
 *   [**내용] → 위첨자 * + 말풍선만. 목록에는 안 들어간다.
 * registry 가 없으면 번호 각주는 조용히 지우고, 툴팁 각주는 그대로 산다.
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

        if (p.kind === "tip") {
          return (
            <sup key={i} className="fn-ref fn-ref-tip">
              <Tip text={p.value}>
                <button
                  type="button"
                  aria-label={`부연: ${p.value}`}
                  className="fn-tip-trigger"
                >
                  *
                </button>
              </Tip>
            </sup>
          );
        }

        if (!registry) return null;
        const n = registry.add(p.value);
        const isFirst = !registry.marked(n);
        if (isFirst) registry.mark(n);
        return (
          <sup key={i} id={isFirst ? `fnref-${n}` : undefined} className="fn-ref">
            <Tip text={p.value}>
              <a href={`#fn-${n}`} aria-label={`각주 ${n}: ${p.value}`}>
                [{n}]
              </a>
            </Tip>
          </sup>
        );
      })}
    </>
  );
}

/**
 * 문서 하단 각주 목록. 나무위키처럼 [n] 을 누르면 본문 위치로 돌아간다.
 * 번호 각주만 모이고 툴팁 각주([**])는 여기 들어오지 않는다.
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
          <li
            key={note.n}
            id={`fn-${note.n}`}
            className="grid grid-cols-[2.25rem_1fr] scroll-mt-24"
          >
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
