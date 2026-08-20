import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ContentImage from "@/components/ContentImage";
import EditLink from "@/components/EditLink";
import { FnText, FootnoteList } from "@/components/Footnotes";
import InfoBox, { type InfoRow } from "@/components/InfoBox";
import { RefList, type RefItem } from "@/components/Links";
import PdfViewer from "@/components/PdfViewer";
import { Bullets, EmptyNotice, NumberedList, Paragraphs, TagList } from "@/components/Prose";
import { DocHeader, DocSections, Toc, type DocSection } from "@/components/WikiDoc";
import { FootnoteRegistry } from "@/lib/footnotes";
import { getProfileBySlug, getResearchPlans } from "@/lib/queries";
import type { ResearchPlan, ResearchPlanStatus } from "@/types";

export const revalidate = 300;

type PageProps = { params: Promise<{ person: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { person } = await params;
  const profile = await getProfileBySlug(person);
  return {
    title: "연구",
    description: profile ? `${profile.name}의 연구 관심사와 연구계획서.` : undefined,
  };
}

const STATUS_LABEL: Record<ResearchPlanStatus, string> = {
  draft: "초안",
  in_progress: "진행 중",
  submitted: "제출됨",
  published: "게재",
};

/** 계획서 한 편을 하위 섹션(요약 · 연구 질문 · 방법 · 자료)으로 펼친다. */
function planSection(
  plan: ResearchPlan,
  index: number,
  person: string,
  backHere: string,
  fn: FootnoteRegistry,
): DocSection {
  const base = `plan-${index + 1}`;

  const refs: RefItem[] = [
    ...(plan.pdf_url ? [{ label: "연구계획서 PDF", href: plan.pdf_url }] : []),
    ...plan.reference_urls.map((href, i) => ({ label: `참고 자료 ${i + 1}`, href })),
  ];

  const children: DocSection[] = [
    {
      id: `${base}-abstract`,
      title: "요약",
      body: plan.abstract ? (
        <Paragraphs text={plan.abstract} fn={fn} />
      ) : (
        <EmptyNotice>아직 작성되지 않았다.</EmptyNotice>
      ),
    },
    {
      id: `${base}-questions`,
      title: "연구 질문",
      body: plan.research_questions.length ? (
        <NumberedList items={plan.research_questions} fn={fn} />
      ) : (
        <EmptyNotice>등록된 연구 질문이 없다.</EmptyNotice>
      ),
    },
  ];

  if (plan.methodology) {
    children.push({
      id: `${base}-method`,
      title: "연구 방법",
      body: <Paragraphs text={plan.methodology} fn={fn} />,
    });
  }

  if (refs.length) {
    children.push({
      id: `${base}-files`,
      title: "자료 및 참조",
      body: (
        <div className="space-y-5">
          {plan.pdf_url ? <PdfViewer src={plan.pdf_url} title={plan.title} /> : null}
          <RefList items={refs} />
        </div>
      ),
    });
  }

  return {
    id: base,
    title: plan.title,
    body: (
      <div>
        <p className="text-sm text-ink-muted">
          상태: {STATUS_LABEL[plan.status]}
          {plan.interests.length ? (
            <>
              {" · 키워드: "}
              <FnText text={plan.interests.join(", ")} registry={fn} />
            </>
          ) : null}{" "}
          <EditLink table="research_plans" id={plan.id} person={person} back={backHere} />
        </p>
        <ContentImage src={plan.image_url} width={plan.image_width} alt={`${plan.title} 이미지`} />
      </div>
    ),
    children,
  };
}

export default async function ResearchPage({ params }: PageProps) {
  const { person } = await params;
  const profile = await getProfileBySlug(person);
  if (!profile) notFound();

  const plans = await getResearchPlans(profile.id);
  const backHere = `/${profile.slug}/research`;
  const fn = new FootnoteRegistry();

  const interests = Array.from(new Set(plans.flatMap((p) => p.interests)));
  const allQuestions = plans.flatMap((p) => p.research_questions);
  const hasPdf = plans.some((p) => p.pdf_url);

  const infoRows: InfoRow[] = [
    { label: "계획서", value: `${plans.length}편` },
    ...(allQuestions.length
      ? [{ label: "연구 질문", value: `${allQuestions.length}개` }]
      : []),
    ...(interests.length ? [{ label: "관심 키워드", value: `${interests.length}개` }] : []),
    { label: "PDF", value: hasPdf ? "제공" : "준비 중" },
  ];

  const sections: DocSection[] = [
    {
      id: "interests",
      title: "연구 관심사",
      body: interests.length ? (
        <div className="space-y-4">
          <TagList items={interests} label="연구 관심사" fn={fn} />
          <p className="max-w-prose text-sm leading-relaxed text-ink-muted">
            등록된 연구계획서에서 모은 키워드다. 계획서를 추가하면 이 목록도 함께 늘어난다.
          </p>
        </div>
      ) : (
        <EmptyNotice>아직 등록된 연구 키워드가 없다.</EmptyNotice>
      ),
    },
    // 계획서가 하나뿐이면 아래 계획서 섹션의 연구 질문과 그대로 겹친다.
    // 두 편 이상일 때만 전체 질문을 한눈에 보는 절을 둔다.
    ...(plans.length > 1 && allQuestions.length
      ? [
          {
            id: "questions",
            title: "연구 질문",
            body: (
              <div className="space-y-4">
                <p className="max-w-prose leading-[1.85] text-ink-soft">
                  지금 붙들고 있는 질문들이다. 각 질문이 어느 계획서에 속하는지는 아래
                  계획서 항목에서 확인할 수 있다.
                </p>
                <Bullets items={allQuestions} fn={fn} />
              </div>
            ),
          } satisfies DocSection,
        ]
      : []),
    ...(plans.length
      ? plans.map((plan, i) => planSection(plan, i, profile.slug, backHere, fn))
      : [
          {
            id: "plans-empty",
            title: "연구계획서",
            body: <EmptyNotice>아직 등록된 연구계획서가 없다.</EmptyNotice>,
          } satisfies DocSection,
        ]),
  ];

  return (
    <article>
      <DocHeader
        kicker="연구"
        title="연구 관심사와 계획"
        lead={<p>현재 진행 중인 연구 질문과 계획서 요약이다.</p>}
      />

      <p className="no-print mt-3 text-sm">
        <EditLink
          table="research_plans"
          person={profile.slug}
          back={backHere}
          label="+ 새 연구계획"
        />
      </p>

      <InfoBox title="연구 개요" rows={infoRows} fn={fn} />

      <Toc sections={sections} />
      <DocSections sections={sections} fn={fn} />
      <FootnoteList registry={fn} />
    </article>
  );
}
