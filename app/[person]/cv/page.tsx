import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ExpertiseGrid from "@/components/ExpertiseGrid";
import { FnText, FootnoteList } from "@/components/Footnotes";
import InfoBox, { type InfoRow } from "@/components/InfoBox";
import { ExternalLink } from "@/components/Links";
import { Bullets, EmptyNotice, Paragraphs, TagList } from "@/components/Prose";
import { DocHeader, DocSections, Toc, type DocSection } from "@/components/WikiDoc";
import EditLink from "@/components/EditLink";
import { FootnoteRegistry } from "@/lib/footnotes";
import { compact, formatMonth, formatPeriod } from "@/lib/format";
import {
  getCertifications,
  getEducation,
  getExperiences,
  getProfileBySlug,
  getProjects,
  getTimeline,
} from "@/lib/queries";
import type { Certification, Education, Experience, TimelineEntry } from "@/types";

export const revalidate = 300;

type PageProps = { params: Promise<{ person: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { person } = await params;
  const profile = await getProfileBySlug(person);
  return {
    title: "이력",
    description: profile ? `${profile.name}의 경력, 학력, 역량 요약.` : undefined,
  };
}

const CERT_KIND_LABEL: Record<Certification["kind"], string> = {
  certificate: "자격증",
  license: "면허",
  course: "수료",
  award: "수상",
};

/** 연혁 한 줄의 연도 표기. "2026.07" / "2019 – 2021" / "2024" */
function timelineLabel(entry: TimelineEntry): string {
  if (entry.end_year) return `${entry.year} – ${entry.end_year}`;
  if (entry.month) return `${entry.year}.${String(entry.month).padStart(2, "0")}`;
  return String(entry.year);
}

/** 가장 이른 경력 시작일 기준 활동 기간. 없으면 빈 문자열. */
function careerSpan(experiences: Experience[]): string {
  const starts = experiences.map((e) => e.period_start).filter(Boolean).sort();
  if (!starts.length) return "";
  return `${formatMonth(starts[0])} – 현재`;
}

function ExperienceItem({
  item,
  editLink,
  fn,
}: {
  item: Experience;
  editLink?: React.ReactNode;
  fn?: FootnoteRegistry;
}) {
  const period = formatPeriod(item.period_start, item.period_end, item.is_current);
  const sub = compact([item.employment_type, item.location]).join(" · ");

  return (
    <article className="border-b border-line py-6 first:pt-0">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h3 className="text-lg font-bold tracking-tight text-ink">{item.title}</h3>
        <span className="text-ink-soft">{item.org}</span>
        {editLink}
      </div>

      {/* 기간이 비어 있을 때 구분점만 남지 않도록 값이 있는 조각만 잇는다. */}
      <p className="mt-1 font-mono text-xs text-ink-muted">
        {compact([period, sub]).join(" · ")}
      </p>

      <Paragraphs text={item.description} className="mt-3" fn={fn} />

      {item.highlights.length ? (
        <div className="mt-4">
          <Bullets items={item.highlights} fn={fn} />
        </div>
      ) : null}
    </article>
  );
}

function EducationItem({
  item,
  editLink,
  fn,
}: {
  item: Education;
  editLink?: React.ReactNode;
  fn?: FootnoteRegistry;
}) {
  const period = formatPeriod(item.period_start, item.period_end, item.is_current);

  // 기관명을 밝히지 않는 학력은 전공이 제목 자리를 대신한다.
  const heading = item.school ?? item.field ?? item.degree ?? "";
  const sub = compact(item.school ? [item.degree, item.field] : [item.degree]).join(" · ");

  return (
    <article className="border-b border-line py-6 first:pt-0">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h3 className="text-lg font-bold tracking-tight text-ink">{heading}</h3>
        {sub ? <span className="text-ink-soft">{sub}</span> : null}
        {editLink}
      </div>

      <p className="mt-1 font-mono text-xs text-ink-muted">
        {compact([period, item.location]).join(" · ")}
      </p>

      <Paragraphs text={item.note} className="mt-3" fn={fn} />
    </article>
  );
}

export default async function CvPage({ params }: PageProps) {
  const { person } = await params;
  const profile = await getProfileBySlug(person);
  if (!profile) notFound();

  const [experiences, education, projects, certifications, timeline] = await Promise.all([
    getExperiences(profile.id),
    getEducation(profile.id),
    getProjects(profile.id),
    getCertifications(profile.id),
    getTimeline(profile.id),
  ]);

  // 역량 목록은 따로 관리하지 않고 실제 프로젝트에서 쓴 스택을 모아 만든다.
  const stack = Array.from(new Set(projects.flatMap((p) => p.tech_stack))).sort();
  const span = careerSpan(experiences);

  // [수정] 링크가 저장 후 돌아올 곳 — 지금 보고 있는 이 문서.
  const backHere = `/${profile.slug}/cv`;
  const fn = new FootnoteRegistry();

  const infoRows: InfoRow[] = (
    [
      span ? { label: "활동 기간", value: span } : null,
      experiences.length ? { label: "경력", value: `${experiences.length}건` } : null,
      education.length ? { label: "학력", value: `${education.length}건` } : null,
      certifications.length
        ? { label: "자격·면허", value: `${certifications.length}건` }
        : null,
      stack.length ? { label: "사용 기술", value: `${stack.length}종` } : null,
    ] as (InfoRow | null)[]
  ).filter((row): row is InfoRow => row !== null);

  const sections: DocSection[] = [
    {
      id: "summary",
      title: "이력 요약",
      body: (
        <div className="max-w-prose space-y-4 leading-[1.85] text-ink-soft">
          {profile.intro ? (
            <p>
              <FnText text={profile.intro} registry={fn} />
            </p>
          ) : null}
          {experiences.length ? (
            <p>
              지금까지 {experiences.length}개 조직에서 일했다. 그 사이 진행한 작업은{" "}
              <Link href={`/${profile.slug}/work`} className="doc-link">
                작업 문서
              </Link>
              에 케이스 스터디로 정리돼 있다.
            </p>
          ) : null}
          {profile.resume_pdf_url ? (
            <p>
              PDF 이력서:{" "}
              <ExternalLink href={profile.resume_pdf_url}>이력서 내려받기</ExternalLink>
            </p>
          ) : null}
        </div>
      ),
    },
    {
      id: "experience",
      title: "경력",
      body: (
        <div>
          <p className="no-print mb-2 text-right">
            <EditLink table="experiences" person={profile.slug} back={backHere} label="+ 추가" />
          </p>
          {experiences.length ? (
            <div className="border-t border-line">
              {experiences.map((item) => (
                <ExperienceItem
                  key={item.id}
                  item={item}
                  fn={fn}
                  editLink={
                    <EditLink
                      table="experiences"
                      id={item.id}
                      person={profile.slug}
                      back={backHere}
                    />
                  }
                />
              ))}
            </div>
          ) : (
            <EmptyNotice>아직 등록된 경력이 없다.</EmptyNotice>
          )}
        </div>
      ),
    },
    {
      id: "education",
      title: "학력",
      body: (
        <div>
          <p className="no-print mb-2 text-right">
            <EditLink table="education" person={profile.slug} back={backHere} label="+ 추가" />
          </p>
          {education.length ? (
            <div className="border-t border-line">
              {education.map((item) => (
                <EducationItem
                  key={item.id}
                  item={item}
                  fn={fn}
                  editLink={
                    <EditLink
                      table="education"
                      id={item.id}
                      person={profile.slug}
                      back={backHere}
                    />
                  }
                />
              ))}
            </div>
          ) : (
            <EmptyNotice>아직 등록된 학력이 없다.</EmptyNotice>
          )}
        </div>
      ),
    },
    {
      id: "certifications",
      title: "자격 및 면허",
      body: (
        <div>
          <p className="no-print mb-2 text-right">
            <EditLink
              table="certifications"
              person={profile.slug}
              back={backHere}
              label="+ 추가"
            />
          </p>
          {certifications.length ? (
        <table className="w-full max-w-prose border-collapse text-sm">
          <thead>
            <tr className="bg-slab text-on-slab">
              <th scope="col" className="px-3 py-2 text-left font-semibold">
                명칭
              </th>
              <th scope="col" className="px-3 py-2 text-left font-semibold">
                구분
              </th>
              <th scope="col" className="px-3 py-2 text-left font-semibold">
                발급
              </th>
            </tr>
          </thead>
          <tbody>
            {certifications.map((cert) => (
              <tr key={cert.id} className="border-b border-line align-top">
                <td className="px-3 py-2 font-medium text-ink">
                  {cert.name}{" "}
                  <EditLink
                    table="certifications"
                    id={cert.id}
                    person={profile.slug}
                    back={backHere}
                  />
                  {cert.note ? (
                    <span className="mt-0.5 block text-xs font-normal text-ink-muted">
                      {cert.note}
                    </span>
                  ) : null}
                </td>
                <td className="px-3 py-2 text-ink-muted">{CERT_KIND_LABEL[cert.kind]}</td>
                <td className="px-3 py-2 text-ink-muted">
                  {compact([cert.issuer, formatMonth(cert.issued_on)]).join(" · ") || "—"}
                </td>
              </tr>
            ))}
          </tbody>
          </table>
          ) : (
            <EmptyNotice>아직 등록된 자격·면허가 없다.</EmptyNotice>
          )}
        </div>
      ),
    },
    {
      id: "timeline",
      title: "연혁",
      body: (
        <div className="space-y-3">
          <div className="no-print flex items-center justify-between">
            <p className="max-w-prose text-sm leading-relaxed text-ink-muted">
              경력·학력에 담기지 않는 활동까지 연도순으로 늘어놓았다.
            </p>
            <EditLink table="timeline" person={profile.slug} back={backHere} label="+ 추가" />
          </div>
          {timeline.length ? (
            <ol className="max-w-prose border-t-2 border-rule">
              {timeline.map((entry) => (
                <li
                  key={entry.id}
                  className="grid grid-cols-[5.5rem_1fr] gap-3 border-b border-line py-3"
                >
                  <span className="font-mono text-sm font-semibold text-ink">
                    {timelineLabel(entry)}
                  </span>
                  <span>
                    <span className="block leading-relaxed text-ink">
                      {entry.title}{" "}
                      <EditLink
                        table="timeline"
                        id={entry.id}
                        person={profile.slug}
                        back={backHere}
                      />
                    </span>
                    <span className="mt-0.5 block text-xs text-ink-muted">
                      {compact([entry.category, entry.note]).join(" · ")}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <EmptyNotice>아직 등록된 연혁이 없다.</EmptyNotice>
          )}
        </div>
      ),
    },
    {
      id: "skills",
      title: "역량",
      children: [
        ...(profile.expertise.length
          ? [
              {
                id: "skills-expertise",
                title: "전문 분야",
                body: <ExpertiseGrid areas={profile.expertise} />,
              } satisfies DocSection,
            ]
          : []),
        {
          id: "skills-stack",
          title: "프로젝트에서 실제로 쓴 기술",
          body: stack.length ? (
            <div className="space-y-3">
              <TagList items={stack} label="사용 기술" />
              <p className="text-sm text-ink-muted">
                이 목록은 등록된 프로젝트의 스택에서 자동으로 모은 것이다. 손으로
                관리하지 않으므로 실제 작업과 어긋나지 않는다.
              </p>
            </div>
          ) : (
            <EmptyNotice>프로젝트에 기술 스택을 채우면 여기에 자동으로 모인다.</EmptyNotice>
          ),
        },
        ...(profile.target_primary || profile.target_secondary || profile.target_edge
          ? [
              {
                id: "skills-target",
                title: "지향 직무",
                body: (
                  <dl className="max-w-prose divide-y divide-line-soft border-y border-line">
                    {profile.target_primary ? (
                      <div className="grid grid-cols-[4.5rem_1fr] gap-3 py-3">
                        <dt className="text-sm font-semibold text-ink-muted">우선</dt>
                        <dd className="leading-relaxed text-ink-soft">
                          {profile.target_primary}
                        </dd>
                      </div>
                    ) : null}
                    {profile.target_secondary ? (
                      <div className="grid grid-cols-[4.5rem_1fr] gap-3 py-3">
                        <dt className="text-sm font-semibold text-ink-muted">확장</dt>
                        <dd className="leading-relaxed text-ink-soft">
                          {profile.target_secondary}
                        </dd>
                      </div>
                    ) : null}
                    {profile.target_edge ? (
                      <div className="grid grid-cols-[4.5rem_1fr] gap-3 py-3">
                        <dt className="text-sm font-semibold text-ink-muted">차별점</dt>
                        <dd className="leading-relaxed text-ink-soft">
                          {profile.target_edge}
                        </dd>
                      </div>
                    ) : null}
                  </dl>
                ),
              } satisfies DocSection,
            ]
          : []),
      ],
    },
  ];

  return (
    <article>
      <DocHeader
        kicker="이력"
        title="이력"
        lead={
          <p>경력, 학력, 역량을 한 문서에 모았다. 세부 작업 내용은 작업 문서로 나눠 두었다.</p>
        }
      />

      <InfoBox title="이력 개요" rows={infoRows} />

      <Toc sections={sections} />
      <DocSections sections={sections} />
      <FootnoteList registry={fn} />
    </article>
  );
}
