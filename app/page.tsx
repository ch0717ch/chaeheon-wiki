import Link from "next/link";
import ExpertiseGrid from "@/components/ExpertiseGrid";
import { RefList, type RefItem } from "@/components/Links";
import ProfileCard from "@/components/ProfileCard";
import { EmptyNotice, TagList } from "@/components/Prose";
import ProjectEntry from "@/components/ProjectEntry";
import { DocHeader, DocSections, Toc, type DocSection } from "@/components/WikiDoc";
import { getFeaturedProjects } from "@/lib/queries";
import { docTree, site } from "@/lib/site";

// 콘텐츠는 Supabase 대시보드에서 가끔 바뀐다. 5분마다 다시 만들면 충분하다.
export const revalidate = 300;

export default async function HomePage() {
  const featured = await getFeaturedProjects(3);

  const refs: RefItem[] = [
    site.links.github ? { label: "GitHub", href: site.links.github } : null,
    site.links.blog
      ? { label: `블로그 — ${site.linkNotes.blog}`, href: site.links.blog }
      : null,
    site.links.blogPersonal
      ? {
          label: `블로그 — ${site.linkNotes.blogPersonal}`,
          href: site.links.blogPersonal,
        }
      : null,
    site.links.instagram
      ? { label: `Instagram ${site.linkNotes.instagram}`, href: site.links.instagram }
      : null,
    site.links.linkedin ? { label: "LinkedIn", href: site.links.linkedin } : null,
    site.links.email ? { label: "이메일", href: `mailto:${site.links.email}` } : null,
  ].filter((r): r is RefItem => r !== null);

  const sections: DocSection[] = [
    {
      id: "keywords",
      title: "핵심 키워드",
      body: (
        <div className="space-y-4">
          <TagList items={[...site.keywords]} label="핵심 키워드" />
          <p className="max-w-prose text-sm leading-relaxed text-ink-muted">
            각 키워드가 실제로 어떤 작업으로 이어졌는지는{" "}
            <Link href="/work" className="doc-link">
              작업
            </Link>{" "}
            문서에 케이스 스터디로 정리해 두었다.
          </p>
        </div>
      ),
    },
    {
      id: "expertise",
      title: "전문 분야",
      body: (
        <div className="space-y-5">
          <dl className="max-w-prose space-y-2 text-[0.9375rem]">
            <div className="flex gap-3">
              <dt className="w-16 shrink-0 font-semibold text-ink-muted">주 분야</dt>
              <dd className="text-ink">{site.fieldMain}</dd>
            </div>
            <div className="flex gap-3">
              <dt className="w-16 shrink-0 font-semibold text-ink-muted">부 분야</dt>
              <dd className="text-ink">{site.fieldSub}</dd>
            </div>
          </dl>
          <ExpertiseGrid />
        </div>
      ),
    },
    {
      id: "featured",
      title: "대표 작업",
      body: featured.length ? (
        <div>
          <div className="border-t border-line">
            {featured.map((project) => (
              <ProjectEntry key={project.id} project={project} />
            ))}
          </div>
          <p className="mt-6 text-sm">
            <Link href="/work" className="doc-link">
              전체 프로젝트 목록 보기 →
            </Link>
          </p>
        </div>
      ) : (
        <EmptyNotice>
          아직 등록된 프로젝트가 없다. Supabase 의 <code>projects</code> 테이블에 행을
          추가하면 이 자리에 나타난다.
        </EmptyNotice>
      ),
    },
    {
      id: "documents",
      title: "문서 안내",
      body: (
        <dl className="max-w-prose divide-y divide-line-soft border-y border-line">
          {docTree
            .filter((doc) => doc.href !== "/")
            .map((doc) => (
              <div key={doc.href} className="grid grid-cols-[5rem_1fr] gap-4 py-3">
                <dt className="font-semibold">
                  <Link href={doc.href} className="doc-link">
                    {doc.label}
                  </Link>
                </dt>
                <dd className="text-sm leading-relaxed text-ink-soft">{doc.note}</dd>
              </div>
            ))}
        </dl>
      ),
    },
    {
      id: "links",
      title: "외부 링크",
      body: refs.length ? (
        <div className="space-y-4">
          <RefList items={refs} />
          <p className="text-sm">
            <Link href="/contact" className="doc-link">
              연락 문서에서 전체 목록 보기 →
            </Link>
          </p>
        </div>
      ) : (
        <EmptyNotice>
          <code>lib/site.ts</code> 의 <code>links</code> 값을 채우면 여기에 표시된다.
        </EmptyNotice>
      ),
    },
  ];

  return (
    <article>
      <DocHeader
        kicker="개요"
        title={`${site.name} — ${site.title}`}
        lead={<p>{site.intro}</p>}
      />

      <ProfileCard />

      <Toc sections={sections} />
      <DocSections sections={sections} />
    </article>
  );
}
