import type { Metadata } from "next";
import { notFound } from "next/navigation";
import EditLink from "@/components/EditLink";
import InfoBox, { type InfoRow } from "@/components/InfoBox";
import { EmptyNotice } from "@/components/Prose";
import ProjectEntry from "@/components/ProjectEntry";
import { DocHeader, DocSections, Toc, type DocSection } from "@/components/WikiDoc";
import { getProfileBySlug, getProjects } from "@/lib/queries";
import type { Project } from "@/types";

export const revalidate = 300;

type PageProps = { params: Promise<{ person: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { person } = await params;
  const profile = await getProfileBySlug(person);
  return {
    title: "작업",
    description: profile ? `${profile.name}의 프로젝트 목록.` : undefined,
  };
}

/** 분류가 없는 프로젝트는 "기타"로 묶는다. */
function groupByCategory(projects: Project[]): [string, Project[]][] {
  const groups = new Map<string, Project[]>();
  for (const project of projects) {
    const key = project.category?.trim() || "기타";
    groups.set(key, [...(groups.get(key) ?? []), project]);
  }
  return [...groups.entries()];
}

export default async function WorkPage({ params }: PageProps) {
  const { person } = await params;
  const profile = await getProfileBySlug(person);
  if (!profile) notFound();

  const projects = await getProjects(profile.id);
  const groups = groupByCategory(projects);
  const ongoing = projects.filter((p) => p.is_ongoing);

  const infoRows: InfoRow[] = [
    { label: "총 프로젝트", value: `${projects.length}건` },
    ...(ongoing.length ? [{ label: "진행 중", value: `${ongoing.length}건` }] : []),
    ...(groups.length
      ? [{ label: "분류", value: groups.map(([g]) => g).join(", ") }]
      : []),
  ];

  const backHere = `/${profile.slug}/work`;

  const sections: DocSection[] = projects.length
    ? groups.map(([category, items], i) => ({
        id: `category-${i + 1}`,
        title: `${category} (${items.length})`,
        body: (
          <div className="border-t border-line">
            {items.map((project) => (
              <ProjectEntry
                key={project.id}
                project={project}
                person={profile.slug}
                editLink={
                  <EditLink
                    table="projects"
                    id={project.id}
                    person={profile.slug}
                    back={backHere}
                  />
                }
              />
            ))}
          </div>
        ),
      }))
    : [
        {
          id: "empty",
          title: "등록된 프로젝트",
          body: <EmptyNotice>아직 등록된 프로젝트가 없다.</EmptyNotice>,
        },
      ];

  return (
    <article>
      <DocHeader
        kicker="작업"
        title="프로젝트 목록"
        lead={
          <p>
            지금까지 진행한 작업이다. 제목을 누르면 문제 → 역할 → 핵심 판단 → 결과 순으로
            정리한 케이스 스터디로 이동한다.
          </p>
        }
      />

      <p className="no-print mt-3 text-sm">
        <EditLink table="projects" person={profile.slug} back={backHere} label="+ 새 프로젝트" />
      </p>

      <InfoBox title="목록 개요" rows={infoRows} />

      <Toc sections={sections} />
      <DocSections sections={sections} />
    </article>
  );
}
