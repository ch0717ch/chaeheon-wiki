import Link from "next/link";
import { formatPeriod } from "@/lib/format";
import type { Project } from "@/types";

/**
 * 프로젝트 목록의 한 줄. 카드가 아니라 문헌 목록에 가깝게 만든다.
 * 그림자나 둥근 모서리 대신 가로선으로만 구분한다.
 */
export default function ProjectEntry({ project }: { project: Project }) {
  const period = formatPeriod(project.period_start, project.period_end, project.is_ongoing);

  return (
    <article className="border-b border-line py-6 first:pt-0">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h3 className="text-lg font-bold tracking-tight">
          <Link href={`/work/${project.slug}`} className="doc-link">
            {project.title}
          </Link>
        </h3>
        {project.category ? (
          <span className="text-xs text-ink-muted">{project.category}</span>
        ) : null}
      </div>

      {period ? (
        <p className="mt-1 font-mono text-xs text-ink-muted">{period}</p>
      ) : null}

      {project.summary ? (
        <p className="mt-3 max-w-prose leading-[1.8] text-ink-soft">{project.summary}</p>
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
