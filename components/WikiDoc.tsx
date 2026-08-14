import type { ReactNode } from "react";

/**
 * 위키식 문서 한 편을 구성하는 단위.
 * 페이지가 이 배열을 선언하면 목차 번호와 본문 제목이 같은 소스에서 만들어진다.
 * DOM 을 훑어 목차를 만드는 방식과 달리 서버 렌더 결과가 항상 일치한다.
 */
export type DocSection = {
  id: string;
  title: string;
  body?: ReactNode;
  children?: DocSection[];
};

/** [1, 2] -> "1.2." */
function label(path: number[]): string {
  return `${path.join(".")}.`;
}

/* ---------------------------------------------------------------------
   목차
   --------------------------------------------------------------------- */
function TocList({ sections, path = [] }: { sections: DocSection[]; path?: number[] }) {
  return (
    <ul className={path.length ? "mt-1 ml-4 space-y-1" : "space-y-1"}>
      {sections.map((section, i) => {
        const current = [...path, i + 1];
        return (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              className="group inline-flex gap-1.5 text-sm leading-relaxed text-ink-soft hover:text-ink"
            >
              <span className="sec-num shrink-0">{label(current)}</span>
              <span className="group-hover:underline group-hover:underline-offset-2">
                {section.title}
              </span>
            </a>
            {section.children?.length ? (
              <TocList sections={section.children} path={current} />
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

export function Toc({ sections }: { sections: DocSection[] }) {
  if (!sections.length) return null;

  return (
    <nav
      aria-labelledby="toc-heading"
      className="no-print my-10 border-2 border-rule bg-paper-deep px-5 py-4 sm:inline-block sm:min-w-[18rem]"
    >
      <h2 id="toc-heading" className="eyebrow mb-3">
        목차
      </h2>
      <TocList sections={sections} />
    </nav>
  );
}

/* ---------------------------------------------------------------------
   본문 섹션
   --------------------------------------------------------------------- */
function SectionBlock({ section, path }: { section: DocSection; path: number[] }) {
  const depth = path.length; // 1 = 최상위
  const Heading = (depth === 1 ? "h2" : depth === 2 ? "h3" : "h4") as
    | "h2"
    | "h3"
    | "h4";

  // 최상위 절은 굵은 괘선을 위에 얹어 문서를 눈에 띄게 끊는다.
  const headingStyle =
    depth === 1
      ? "rule-heavy mt-14 pt-3 text-xl font-bold tracking-tight sm:text-2xl"
      : depth === 2
        ? "mt-9 border-b border-line pb-1 text-lg font-bold tracking-tight"
        : "mt-7 text-base font-bold";

  return (
    <section aria-labelledby={section.id} className="scroll-mt-24">
      <Heading id={section.id} className={`${headingStyle} scroll-mt-24 text-ink`}>
        <span className="sec-num mr-2">{label(path)}</span>
        {section.title}
        <a
          href={`#${section.id}`}
          aria-label={`${section.title} 섹션 링크`}
          className="anchor-mark no-print ml-2 text-sm"
        >
          #
        </a>
      </Heading>

      {section.body ? <div className="mt-4">{section.body}</div> : null}

      {section.children?.map((child, i) => (
        <SectionBlock key={child.id} section={child} path={[...path, i + 1]} />
      ))}
    </section>
  );
}

export function DocSections({ sections }: { sections: DocSection[] }) {
  return (
    <>
      {sections.map((section, i) => (
        <SectionBlock key={section.id} section={section} path={[i + 1]} />
      ))}
    </>
  );
}

/* ---------------------------------------------------------------------
   문서 머리 — 제목, 부제, 분류 라벨
   --------------------------------------------------------------------- */
export function DocHeader({
  kicker,
  title,
  lead,
  meta,
}: {
  kicker?: string;
  title: string;
  lead?: ReactNode;
  meta?: ReactNode;
}) {
  return (
    <header className="border-b-2 border-rule pb-6">
      {kicker ? <p className="eyebrow mb-2">{kicker}</p> : null}
      <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-[2rem] sm:leading-tight">
        {title}
      </h1>
      {lead ? (
        <div className="mt-4 max-w-prose text-[1.0625rem] leading-[1.85] text-ink-soft">
          {lead}
        </div>
      ) : null}
      {meta ? <div className="mt-4 text-sm text-ink-muted">{meta}</div> : null}
    </header>
  );
}
