import type { Metadata } from "next";
import InfoBox, { type InfoRow } from "@/components/InfoBox";
import { ExternalLink, RefList, type RefItem } from "@/components/Links";
import {
  Bullets,
  EmptyNotice,
  NumberedList,
  Paragraphs,
  TagList,
} from "@/components/Prose";
import { DocHeader, DocSections, Toc, type DocSection } from "@/components/WikiDoc";
import { getResearchPlans } from "@/lib/queries";
import { site } from "@/lib/site";
import type { ResearchPlan, ResearchPlanStatus } from "@/types";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "연구",
  description: `${site.name}의 연구 관심사, 연구 질문, 연구계획서 요약.`,
};

const STATUS_LABEL: Record<ResearchPlanStatus, string> = {
  draft: "초안",
  in_progress: "진행 중",
  submitted: "제출됨",
  published: "게재",
};

/** 계획서 한 편을 하위 섹션(요약 · 연구 질문 · 방법 · 자료)으로 펼친다. */
function planSection(plan: ResearchPlan, index: number): DocSection {
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
        <Paragraphs text={plan.abstract} />
      ) : (
        <EmptyNotice>
          <code>research_plans.abstract</code> 가 비어 있다.
        </EmptyNotice>
      ),
    },
    {
      id: `${base}-questions`,
      title: "연구 질문",
      body: plan.research_questions.length ? (
        <NumberedList items={plan.research_questions} />
      ) : (
        <EmptyNotice>등록된 연구 질문이 없다.</EmptyNotice>
      ),
    },
  ];

  if (plan.methodology) {
    children.push({
      id: `${base}-method`,
      title: "연구 방법",
      body: <Paragraphs text={plan.methodology} />,
    });
  }

  children.push({
    id: `${base}-files`,
    title: "자료 및 참조",
    body: refs.length ? (
      <div className="space-y-4">
        {plan.pdf_url ? (
          <p>
            <ExternalLink
              href={plan.pdf_url}
              className="inline-block border border-accent px-4 py-2 font-semibold no-underline hover:bg-accent-soft"
            >
              연구계획서 PDF 내려받기
            </ExternalLink>
          </p>
        ) : null}
        <RefList items={refs} />
      </div>
    ) : (
      <EmptyNotice>
        아직 공개된 파일이 없다. <code>research_plans.pdf_url</code> 에 링크를 넣으면
        내려받기 버튼이 생긴다.
      </EmptyNotice>
    ),
  });

  return {
    id: base,
    title: plan.title,
    body: (
      <p className="text-sm text-ink-muted">
        상태: {STATUS_LABEL[plan.status]}
        {plan.interests.length ? ` · 키워드: ${plan.interests.join(", ")}` : ""}
      </p>
    ),
    children,
  };
}

export default async function ResearchPage() {
  const plans = await getResearchPlans();

  // 관심사 키워드는 모든 계획서에서 모은다. 중복은 제거한다.
  const interests = Array.from(new Set(plans.flatMap((p) => p.interests)));
  const allQuestions = plans.flatMap((p) => p.research_questions);
  const hasPdf = plans.some((p) => p.pdf_url);

  const infoRows: InfoRow[] = [
    { label: "계획서", value: `${plans.length}편` },
    ...(allQuestions.length ? [{ label: "연구 질문", value: `${allQuestions.length}개` }] : []),
    ...(interests.length ? [{ label: "관심 키워드", value: `${interests.length}개` }] : []),
    { label: "PDF", value: hasPdf ? "제공" : "준비 중" },
  ];

  const sections: DocSection[] = [
    {
      id: "interests",
      title: "연구 관심사",
      body: interests.length ? (
        <div className="space-y-4">
          <TagList items={interests} label="연구 관심사" />
          <p className="max-w-prose text-sm leading-relaxed text-ink-muted">
            등록된 연구계획서에서 모은 키워드다. 계획서를 추가하면 이 목록도 함께 늘어난다.
          </p>
        </div>
      ) : (
        <EmptyNotice>
          Supabase 의 <code>research_plans.interests</code> 배열을 채우면 여기에 모인다.
        </EmptyNotice>
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
                <Bullets items={allQuestions} />
              </div>
            ),
          } satisfies DocSection,
        ]
      : []),
    ...(plans.length
      ? plans.map(planSection)
      : [
          {
            id: "plans-empty",
            title: "연구계획서",
            body: (
              <EmptyNotice>
                아직 등록된 연구계획서가 없다. Supabase 의 <code>research_plans</code>{" "}
                테이블에 행을 추가하면 요약·연구 질문·방법·PDF 링크가 이 자리에 문서로
                펼쳐진다.
              </EmptyNotice>
            ),
          } satisfies DocSection,
        ]),
  ];

  return (
    <article>
      <DocHeader
        kicker="연구"
        title="연구 관심사와 계획"
        lead={
          <p>
            조직에 쌓인 경험이 사람이 바뀌어도 남게 하는 조건을 다룬다. 아래는 현재
            진행 중인 연구 질문과 계획서 요약이다.
          </p>
        }
      />

      <InfoBox title="연구 개요" rows={infoRows} />

      <Toc sections={sections} />
      <DocSections sections={sections} />
    </article>
  );
}
