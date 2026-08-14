import type { Metadata } from "next";
import InfoBox, { type InfoRow } from "@/components/InfoBox";
import { EmptyNotice } from "@/components/Prose";
import ProjectEntry from "@/components/ProjectEntry";
import { DocHeader, DocSections, Toc, type DocSection } from "@/components/WikiDoc";
import { getProjects } from "@/lib/queries";
import { site } from "@/lib/site";
import type { Project } from "@/types";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "작업",
  description: `${site.name}의 프로젝트 목록. 각 항목은 문제·역할·판단·결과로 정리된 케이스 스터디로 이어진다.`,
};

/** 분류가 없는 프로젝트는 "기타"로 묶는다. 분류 축이 비어 목록이 깨지지 않게 한다. */
function groupByCategory(projects: Project[]): [string, Project[]][] {
  const groups = new Map<string, Project[]>();
  for (const project of projects) {
    const key = project.category?.trim() || "기타";
    groups.set(key, [...(groups.get(key) ?? []), project]);
  }
  return [...groups.entries()];
}

export default async function WorkPage() {
  const projects = await getProjects();
  const groups = groupByCategory(projects);
  const ongoing = projects.filter((p) => p.is_ongoing);

  const infoRows: InfoRow[] = [
    { label: "총 프로젝트", value: `${projects.length}건` },
    ...(ongoing.length ? [{ label: "진행 중", value: `${ongoing.length}건` }] : []),
    ...(groups.length ? [{ label: "분류", value: groups.map(([g]) => g).join(", ") }] : []),
  ];

  const sections: DocSection[] = projects.length
    ? groups.map(([category, items], i) => ({
        id: `category-${i + 1}`,
        title: `${category} (${items.length})`,
        body: (
          <div className="border-t border-line">
            {items.map((project) => (
              <ProjectEntry key={project.id} project={project} />
            ))}
          </div>
        ),
      }))
    : [
        {
          id: "empty",
          title: "등록된 프로젝트",
          body: (
            <EmptyNotice>
              아직 등록된 프로젝트가 없다. Supabase 의 <code>projects</code> 테이블에
              행을 추가하면 이 목록과 개별 케이스 스터디 페이지가 함께 만들어진다.
            </EmptyNotice>
          ),
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

      <InfoBox title="목록 개요" rows={infoRows} />

      <Toc sections={sections} />
      <DocSections sections={sections} />
    </article>
  );
}
