import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ContentImage from "@/components/ContentImage";
import EditLink from "@/components/EditLink";
import { FnText, FootnoteList } from "@/components/Footnotes";
import InfoBox, { type InfoRow } from "@/components/InfoBox";
import { RefList, type RefItem } from "@/components/Links";
import PdfViewer from "@/components/PdfViewer";
import { Bullets, EmptyNotice, Paragraphs, TagList } from "@/components/Prose";
import { DocHeader, DocSections, Toc, type DocSection } from "@/components/WikiDoc";
import { FootnoteRegistry, stripFootnotes } from "@/lib/footnotes";
import { formatPeriod } from "@/lib/format";
import { getProfileBySlug, getProjectBySlug } from "@/lib/queries";
import type { Project } from "@/types";

type PageProps = { params: Promise<{ person: string; slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { person, slug } = await params;
  const profile = await getProfileBySlug(person);
  if (!profile) return { title: "찾을 수 없는 문서" };
  const project = await getProjectBySlug(profile.id, slug);
  if (!project) return { title: "찾을 수 없는 프로젝트" };

  return {
    title: project.title,
    description: stripFootnotes(project.summary) || undefined,
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
  const { person, slug } = await params;
  const profile = await getProfileBySlug(person);
  if (!profile) notFound();

  const project = await getProjectBySlug(profile.id, slug);
  if (!project) notFound();

  const period = formatPeriod(project.period_start, project.period_end, project.is_ongoing);
  const refs = buildRefs(project);
  const fn = new FootnoteRegistry();

  // 개요 상자에는 한 줄로 끝나는 값만 넣는다.
  const infoRows: InfoRow[] = [
    ...(project.category ? [{ label: "분류", value: project.category }] : []),
    ...(period ? [{ label: "기간", value: period }] : []),
    { label: "상태", value: project.is_ongoing ? "진행 중" : "종료" },
    ...(project.tech_stack.length
      ? [{ label: "스택", value: project.tech_stack.join(", ") }]
      : []),
    ...(refs.length ? [{ label: "참조", value: `${refs.length}건` }] : []),
  ];

  // 섹션 이름은 문서별로 바꿀 수 있다. 비워 두면 기본 이름이 쓰인다.
  const labelDecisions = project.label_decisions || "핵심 판단";

  const sections: DocSection[] = [
    {
      id: "problem",
      title: project.label_problem || "문제",
      body: project.problem ? (
        <Paragraphs text={project.problem} fn={fn} />
      ) : (
        <EmptyNotice>아직 작성되지 않았다.</EmptyNotice>
      ),
    },
    {
      id: "role",
      title: project.label_role || "역할",
      body: project.role ? (
        <Paragraphs text={project.role} fn={fn} />
      ) : (
        <EmptyNotice>아직 작성되지 않았다.</EmptyNotice>
      ),
    },
    {
      id: "decisions",
      title: labelDecisions,
      body: project.key_decisions.length ? (
        <div className="space-y-4">
          {/* 설명 문장은 기본 이름일 때만 — "라인업" 같은 이름으로 바꿨는데
              판단 얘기가 나오면 어색하다. */}
          {labelDecisions === "핵심 판단" ? (
            <p className="max-w-prose text-sm leading-relaxed text-ink-muted">
              선택지가 갈렸던 지점과 그때 고른 방향, 그리고 그렇게 고른 이유다.
            </p>
          ) : null}
          <Bullets items={project.key_decisions} fn={fn} />
        </div>
      ) : (
        <EmptyNotice>아직 작성되지 않았다.</EmptyNotice>
      ),
    },
    {
      id: "outcome",
      title: project.label_outcome || "결과",
      body: project.outcome ? (
        <Paragraphs text={project.outcome} fn={fn} />
      ) : (
        <EmptyNotice>아직 작성되지 않았다.</EmptyNotice>
      ),
    },
    ...(project.tech_stack.length
      ? [
          {
            id: "stack",
            title: "사용 기술",
            body: <TagList items={project.tech_stack} label="사용 기술" fn={fn} />,
          } satisfies DocSection,
        ]
      : []),
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
        <EmptyNotice>연결된 외부 링크가 없다.</EmptyNotice>
      ),
    },
  ];

  return (
    <article>
      <p className="no-print mb-6 flex items-center justify-between text-sm">
        <Link href={`/${profile.slug}/work`} className="doc-link">
          ← 작업 목록
        </Link>
        <EditLink
          table="projects"
          id={project.id}
          person={profile.slug}
          back={`/${profile.slug}/work/${project.slug}`}
          label="이 문서 수정"
        />
      </p>

      <DocHeader
        kicker="케이스 스터디"
        title={<FnText text={project.title} registry={fn} />}
        lead={
          project.summary ? (
            <p className="whitespace-pre-line">
              <FnText text={project.summary} registry={fn} />
            </p>
          ) : undefined
        }
        meta={period ? <span className="font-mono">{period}</span> : undefined}
      />

      <InfoBox title="프로젝트 개요" rows={infoRows} fn={fn} />

      {/* 대표 이미지 — 문서 머리와 목차 사이. 없으면 기존 배치 그대로. */}
      <ContentImage src={project.image_url} width={project.image_width} alt={project.title} />

      <Toc sections={sections} />
      <DocSections sections={sections} fn={fn} />
      <FootnoteList registry={fn} />
    </article>
  );
}
