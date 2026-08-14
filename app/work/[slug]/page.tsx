import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import InfoBox, { type InfoRow } from "@/components/InfoBox";
import { RefList, type RefItem } from "@/components/Links";
import PdfViewer from "@/components/PdfViewer";
import { Bullets, EmptyNotice, Paragraphs, TagList } from "@/components/Prose";
import { DocHeader, DocSections, Toc, type DocSection } from "@/components/WikiDoc";
import { formatPeriod } from "@/lib/format";
import { getProjectBySlug, getProjects } from "@/lib/queries";
import type { Project } from "@/types";

export const revalidate = 300;

// 등록된 프로젝트는 빌드 시점에 미리 만든다. 새로 추가된 slug 는
// 아래 dynamicParams(기본값 true) 덕분에 요청 시점에 생성된다.
export async function generateStaticParams() {
  const projects = await getProjects();
  return projects.map((p) => ({ slug: p.slug }));
}

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) return { title: "찾을 수 없는 프로젝트" };

  return {
    title: project.title,
    description: project.summary || undefined,
    openGraph: { title: project.title, description: project.summary || undefined },
  };
}

/** 값이 있는 외부 링크만 참조 목록으로 만든다. */
function buildRefs(project: Project): RefItem[] {
  const candidates: { label: string; href: string | null }[] = [
    { label: "GitHub 저장소", href: project.github_url },
    { label: "블로그 글", href: project.blog_url },
    { label: "데모", href: project.demo_url },
    { label: "PDF 자료", href: project.pdf_url },
  ];

  return candidates
    .filter((item): item is RefItem => Boolean(item.href))
    .map(({ label, href }) => ({ label, href }));
}

export default async function ProjectPage({ params }: PageProps) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project) notFound();

  const period = formatPeriod(project.period_start, project.period_end, project.is_ongoing);
  const refs = buildRefs(project);

  // 개요 상자에는 한 줄로 끝나는 값만 넣는다. 역할처럼 긴 문장은
  // 상자를 세로로 늘려 본문을 밀어내므로 아래 섹션에만 둔다.
  const infoRows: InfoRow[] = [
    ...(project.category ? [{ label: "분류", value: project.category }] : []),
    ...(period ? [{ label: "기간", value: period }] : []),
    { label: "상태", value: project.is_ongoing ? "진행 중" : "종료" },
    ...(project.tech_stack.length
      ? [{ label: "스택", value: project.tech_stack.join(", ") }]
      : []),
    ...(refs.length ? [{ label: "참조", value: `${refs.length}건` }] : []),
  ];

  const sections: DocSection[] = [
    {
      id: "problem",
      title: "문제",
      body: project.problem ? (
        <Paragraphs text={project.problem} />
      ) : (
        <EmptyNotice>
          <code>projects.problem</code> 이 비어 있다.
        </EmptyNotice>
      ),
    },
    {
      id: "role",
      title: "역할",
      body: project.role ? (
        <Paragraphs text={project.role} />
      ) : (
        <EmptyNotice>
          <code>projects.role</code> 이 비어 있다.
        </EmptyNotice>
      ),
    },
    {
      id: "decisions",
      title: "핵심 판단",
      body: project.key_decisions.length ? (
        <div className="space-y-4">
          <p className="max-w-prose text-sm leading-relaxed text-ink-muted">
            선택지가 갈렸던 지점과 그때 고른 방향, 그리고 그렇게 고른 이유다.
          </p>
          <Bullets items={project.key_decisions} />
        </div>
      ) : (
        <EmptyNotice>
          <code>projects.key_decisions</code> 배열이 비어 있다.
        </EmptyNotice>
      ),
    },
    {
      id: "outcome",
      title: "결과",
      body: project.outcome ? (
        <Paragraphs text={project.outcome} />
      ) : (
        <EmptyNotice>
          <code>projects.outcome</code> 이 비어 있다.
        </EmptyNotice>
      ),
    },
    {
      id: "stack",
      title: "사용 기술",
      body: project.tech_stack.length ? (
        <TagList items={project.tech_stack} label="사용 기술" />
      ) : (
        <EmptyNotice>등록된 기술 스택이 없다.</EmptyNotice>
      ),
    },
    ...(project.pdf_url
      ? [
          {
            id: "original",
            title: "원본 포트폴리오",
            body: (
              <div className="space-y-4">
                <p className="max-w-prose text-sm leading-relaxed text-ink-muted">
                  아래 요약은 이 문서에서 뽑아낸 것이다. 편집된 원본을 그대로 보려면 아래
                  뷰어를 사용한다.
                </p>
                <PdfViewer src={project.pdf_url} title={project.title} />
              </div>
            ),
          } satisfies DocSection,
        ]
      : []),
    {
      id: "refs",
      title: "참조",
      body: refs.length ? (
        <RefList items={refs} />
      ) : (
        <EmptyNotice>
          연결된 외부 링크가 없다. <code>github_url</code>, <code>blog_url</code>,{" "}
          <code>demo_url</code>, <code>pdf_url</code> 중 값이 있는 것만 표시된다.
        </EmptyNotice>
      ),
    },
  ];

  return (
    <article>
      <p className="no-print mb-6 text-sm">
        <Link href="/work" className="doc-link">
          ← 작업 목록
        </Link>
      </p>

      <DocHeader
        kicker="케이스 스터디"
        title={project.title}
        lead={project.summary ? <p>{project.summary}</p> : undefined}
        meta={period ? <span className="font-mono">{period}</span> : undefined}
      />

      <InfoBox title="프로젝트 개요" rows={infoRows} />

      <Toc sections={sections} />
      <DocSections sections={sections} />
    </article>
  );
}
