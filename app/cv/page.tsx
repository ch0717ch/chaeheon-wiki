import type { Metadata } from "next";
import Link from "next/link";
import InfoBox, { type InfoRow } from "@/components/InfoBox";
import { ExternalLink } from "@/components/Links";
import { Bullets, EmptyNotice, Paragraphs, TagList } from "@/components/Prose";
import { DocHeader, DocSections, Toc, type DocSection } from "@/components/WikiDoc";
import { compact, formatMonth, formatPeriod } from "@/lib/format";
import { getEducation, getExperiences, getProjects } from "@/lib/queries";
import { site } from "@/lib/site";
import type { Education, Experience } from "@/types";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "이력",
  description: `${site.name}의 경력, 학력, 역량 요약.`,
};

/** 가장 이른 경력 시작일을 찾아 활동 기간을 만든다. 없으면 빈 문자열. */
function careerSpan(experiences: Experience[]): string {
  const starts = experiences.map((e) => e.period_start).filter(Boolean).sort();
  if (!starts.length) return "";
  return `${formatMonth(starts[0])} – 현재`;
}

function ExperienceItem({ item }: { item: Experience }) {
  const period = formatPeriod(item.period_start, item.period_end, item.is_current);
  const sub = compact([item.employment_type, item.location]).join(" · ");

  return (
    <article className="border-b border-line py-6 first:pt-0">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h3 className="text-lg font-bold tracking-tight text-ink">{item.title}</h3>
        <span className="text-ink-soft">{item.org}</span>
      </div>

      <p className="mt-1 font-mono text-xs text-ink-muted">
        {period}
        {sub ? ` · ${sub}` : ""}
      </p>

      <Paragraphs text={item.description} className="mt-3" />

      {item.highlights.length ? (
        <div className="mt-4">
          <Bullets items={item.highlights} />
        </div>
      ) : null}
    </article>
  );
}

function EducationItem({ item }: { item: Education }) {
  const period = formatPeriod(item.period_start, item.period_end, item.is_current);
  const sub = compact([item.degree, item.field]).join(" · ");

  return (
    <article className="border-b border-line py-6 first:pt-0">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h3 className="text-lg font-bold tracking-tight text-ink">{item.school}</h3>
        {sub ? <span className="text-ink-soft">{sub}</span> : null}
      </div>

      <p className="mt-1 font-mono text-xs text-ink-muted">
        {period}
        {item.location ? ` · ${item.location}` : ""}
      </p>

      <Paragraphs text={item.note} className="mt-3" />
    </article>
  );
}

export default async function CvPage() {
  const [experiences, education, projects] = await Promise.all([
    getExperiences(),
    getEducation(),
    getProjects(),
  ]);

  // 역량 목록은 따로 관리하지 않고 실제 프로젝트에서 쓴 스택을 모아 만든다.
  // 손으로 유지하는 목록은 금세 실제 작업과 어긋난다.
  const stack = Array.from(new Set(projects.flatMap((p) => p.tech_stack))).sort();
  const span = careerSpan(experiences);

  const infoRows: InfoRow[] = (
    [
      span ? { label: "활동 기간", value: span } : null,
      experiences.length ? { label: "경력", value: `${experiences.length}건` } : null,
      education.length ? { label: "학력", value: `${education.length}건` } : null,
      stack.length ? { label: "사용 기술", value: `${stack.length}종` } : null,
    ] as (InfoRow | null)[]
  ).filter((row): row is InfoRow => row !== null);

  const sections: DocSection[] = [
    {
      id: "summary",
      title: "이력 요약",
      body: (
        <div className="max-w-prose space-y-4 leading-[1.85] text-ink-soft">
          <p>{site.intro}</p>
          {experiences.length ? (
            <p>
              지금까지 {experiences.length}개 조직에서 일했다. 그 사이 진행한 작업은{" "}
              <Link href="/work" className="doc-link">
                작업 문서
              </Link>
              에 케이스 스터디로 정리돼 있다.
            </p>
          ) : null}
          {site.resumePdfUrl ? (
            <p>
              PDF 이력서:{" "}
              <ExternalLink href={site.resumePdfUrl}>이력서 내려받기</ExternalLink>
            </p>
          ) : null}
        </div>
      ),
    },
    {
      id: "experience",
      title: "경력",
      body: experiences.length ? (
        <div className="border-t border-line">
          {experiences.map((item) => (
            <ExperienceItem key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <EmptyNotice>
          아직 등록된 경력이 없다. Supabase 의 <code>experiences</code> 테이블에 행을
          추가한다.
        </EmptyNotice>
      ),
    },
    {
      id: "education",
      title: "학력",
      body: education.length ? (
        <div className="border-t border-line">
          {education.map((item) => (
            <EducationItem key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <EmptyNotice>
          아직 등록된 학력이 없다. Supabase 의 <code>education</code> 테이블에 행을
          추가한다.
        </EmptyNotice>
      ),
    },
    {
      id: "skills",
      title: "역량",
      children: [
        {
          id: "skills-focus",
          title: "관심 영역",
          body: <TagList items={[...site.keywords]} label="관심 영역" />,
        },
        {
          id: "skills-stack",
          title: "사용 기술",
          body: stack.length ? (
            <div className="space-y-3">
              <TagList items={stack} label="사용 기술" />
              <p className="text-sm text-ink-muted">
                등록된 프로젝트에서 실제로 사용한 기술만 모은 목록이다.
              </p>
            </div>
          ) : (
            <EmptyNotice>
              프로젝트에 <code>tech_stack</code> 을 채우면 여기에 자동으로 모인다.
            </EmptyNotice>
          ),
        },
      ],
    },
  ];

  return (
    <article>
      <DocHeader
        kicker="이력"
        title="이력"
        lead={<p>경력, 학력, 역량을 한 문서에 모았다. 세부 작업 내용은 작업 문서로 나눠 두었다.</p>}
      />

      <InfoBox title="이력 개요" rows={infoRows} />

      <Toc sections={sections} />
      <DocSections sections={sections} />
    </article>
  );
}
