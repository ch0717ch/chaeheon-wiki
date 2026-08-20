import Link from "next/link";
import { FnText } from "@/components/Footnotes";
import type { FootnoteRegistry } from "@/lib/footnotes";
import { formatPeriod } from "@/lib/format";
import type { Project } from "@/types";

/**
 * 프로젝트 목록의 한 줄. 카드가 아니라 문헌 목록에 가깝게 만든다.
 * 그림자나 둥근 모서리 대신 가로선으로만 구분한다.
 */
export default function ProjectEntry({
  project,
  person,
  editLink,
  fn,
}: {
  project: Project;
  person: string; // 인물 slug — 케이스 스터디 링크 경로에 필요하다
  /** 나무위키식 [수정] 링크. 넣는 쪽에서 EditLink 를 만들어 전달한다. */
  editLink?: React.ReactNode;
  fn?: FootnoteRegistry;
}) {
  const period = formatPeriod(project.period_start, project.period_end, project.is_ongoing);

  return (
    <article className="border-b border-line py-6 first:pt-0">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h3 className="text-lg font-bold tracking-tight">
          <Link href={`/${person}/work/${project.slug}`} className="doc-link">
            {project.title}
          </Link>
        </h3>
        {project.category ? (
          <span className="text-xs text-ink-muted">{project.category}</span>
        ) : null}
        {editLink}
      </div>

      {period ? (
        <p className="mt-1 font-mono text-xs text-ink-muted">{period}</p>
      ) : null}

      {project.summary ? (
        <p className="mt-3 max-w-prose whitespace-pre-line leading-[1.8] text-ink-soft">
          <FnText text={project.summary} registry={fn} />
        </p>
      ) : null}

      {project.tech_stack.length ? (
        <p className="mt-3 text-[0.8125rem] text-ink-muted">
          <span className="font-semibold">스택 </span>
          {project.tech_stack.join(" · ")}
        </p>
      ) : null}
    </article>
  );
}
