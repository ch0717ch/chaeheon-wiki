import Link from "next/link";
import { notFound } from "next/navigation";
import EditLink from "@/components/EditLink";
import ExpertiseGrid from "@/components/ExpertiseGrid";
import { FnText, FootnoteList } from "@/components/Footnotes";
import { FootnoteRegistry } from "@/lib/footnotes";
import { RefList, type RefItem } from "@/components/Links";
import ProfileCard from "@/components/ProfileCard";
import { EmptyNotice, TagList } from "@/components/Prose";
import ProjectEntry from "@/components/ProjectEntry";
import { DocHeader, DocSections, Toc, type DocSection } from "@/components/WikiDoc";
import { getFeaturedProjects, getProfileBySlug } from "@/lib/queries";
import { docTree } from "@/lib/site";

export const revalidate = 300;

type PageProps = { params: Promise<{ person: string }> };

export default async function OverviewPage({ params }: PageProps) {
  const { person } = await params;
  const profile = await getProfileBySlug(person);
  if (!profile) notFound();

  const featured = await getFeaturedProjects(profile.id, 3);
  const base = `/${profile.slug}`;
  // 각주 번호는 이 페이지 안에서 렌더 순서대로 이어진다.
  const fn = new FootnoteRegistry();

  const refs: RefItem[] = (
    [
      profile.link_github ? { label: "GitHub", href: profile.link_github } : null,
      profile.link_blog ? { label: "블로그", href: profile.link_blog } : null,
      profile.link_blog2 ? { label: "블로그 2", href: profile.link_blog2 } : null,
      profile.link_instagram ? { label: "Instagram", href: profile.link_instagram } : null,
      profile.link_linkedin ? { label: "LinkedIn", href: profile.link_linkedin } : null,
      profile.link_email
        ? { label: "이메일", href: `mailto:${profile.link_email}` }
        : null,
    ] as (RefItem | null)[]
  ).filter((r): r is RefItem => r !== null);

  const sections: DocSection[] = [
    ...(profile.keywords.length
      ? [
          {
            id: "keywords",
            title: "핵심 키워드",
            body: (
              <div className="space-y-4">
                <TagList items={profile.keywords} label="핵심 키워드" fn={fn} />
                <p className="max-w-prose text-sm leading-relaxed text-ink-muted">
                  각 키워드가 실제로 어떤 작업으로 이어졌는지는{" "}
                  <Link href={`${base}/work`} className="doc-link">
                    작업
                  </Link>{" "}
                  문서에 케이스 스터디로 정리해 두었다.
                </p>
              </div>
            ),
          } satisfies DocSection,
        ]
      : []),
    ...(profile.expertise.length || profile.field_main
      ? [
          {
            id: "expertise",
            title: "전문 분야",
            body: (
              <div className="space-y-5">
                {profile.field_main || profile.field_sub ? (
                  <dl className="max-w-prose space-y-2 text-[0.9375rem]">
                    {profile.field_main ? (
                      <div className="flex gap-3">
                        <dt className="w-16 shrink-0 font-semibold text-ink-muted">
                          주 분야
                        </dt>
                        <dd className="text-ink">
                          <FnText text={profile.field_main} registry={fn} />
                        </dd>
                      </div>
                    ) : null}
                    {profile.field_sub ? (
                      <div className="flex gap-3">
                        <dt className="w-16 shrink-0 font-semibold text-ink-muted">
                          부 분야
                        </dt>
                        <dd className="text-ink">
                          <FnText text={profile.field_sub} registry={fn} />
                        </dd>
                      </div>
                    ) : null}
                  </dl>
                ) : null}
                <ExpertiseGrid areas={profile.expertise} fn={fn} />
              </div>
            ),
          } satisfies DocSection,
        ]
      : []),
    {
      id: "featured",
      title: "대표 작업",
      body: featured.length ? (
        <div>
          <div className="border-t border-line">
            {featured.map((project) => (
              <ProjectEntry key={project.id} project={project} person={profile.slug} fn={fn} />
            ))}
          </div>
          <p className="mt-6 text-sm">
            <Link href={`${base}/work`} className="doc-link">
              전체 프로젝트 목록 보기 →
            </Link>
          </p>
        </div>
      ) : (
        <EmptyNotice>아직 등록된 프로젝트가 없다.</EmptyNotice>
      ),
    },
    {
      id: "documents",
      title: "문서 안내",
      body: (
        <dl className="max-w-prose divide-y divide-line-soft border-y border-line">
          {docTree
            .filter((doc) => doc.href !== "")
            .map((doc) => (
              <div key={doc.href} className="grid grid-cols-[5rem_1fr] gap-4 py-3">
                <dt className="font-semibold">
                  <Link href={`${base}${doc.href}`} className="doc-link">
                    {doc.label}
                  </Link>
                </dt>
                <dd className="text-sm leading-relaxed text-ink-soft">{doc.note}</dd>
              </div>
            ))}
        </dl>
      ),
    },
    ...(refs.length
      ? [
          {
            id: "links",
            title: "외부 링크",
            body: (
              <div className="space-y-4">
                <RefList items={refs} />
                <p className="text-sm">
                  <Link href={`${base}/contact`} className="doc-link">
                    연락 문서에서 전체 목록 보기 →
                  </Link>
                </p>
              </div>
            ),
          } satisfies DocSection,
        ]
      : []),
  ];

  return (
    <article>
      <DocHeader
        kicker="개요"
        title={
          <FnText
            text={profile.title ? `${profile.name} — ${profile.title}` : profile.name}
            registry={fn}
          />
        }
        lead={
          profile.intro ? (
            <p className="whitespace-pre-line">
              <FnText text={profile.intro} registry={fn} />
            </p>
          ) : undefined
        }
      />

      {/* 나무위키처럼 문서 자체를 그 자리에서 고친다. 키가 없으면 입력 화면에서 막힌다. */}
      <p className="no-print mt-3 text-sm">
        <EditLink table="people" id={profile.id} back={base} label="문서 수정" />
      </p>

      <ProfileCard profile={profile} fn={fn} />

      <Toc sections={sections} />
      <DocSections sections={sections} fn={fn} />
      <FootnoteList registry={fn} />
    </article>
  );
}
