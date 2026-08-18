import type { Metadata } from "next";
import { notFound } from "next/navigation";
import InfoBox, { type InfoRow } from "@/components/InfoBox";
import { ExternalLink, RefList, type RefItem } from "@/components/Links";
import { EmptyNotice } from "@/components/Prose";
import { DocHeader, DocSections, Toc, type DocSection } from "@/components/WikiDoc";
import { getProfileBySlug } from "@/lib/queries";

export const revalidate = 300;

type PageProps = { params: Promise<{ person: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { person } = await params;
  const profile = await getProfileBySlug(person);
  return {
    title: "연락",
    description: profile ? `${profile.name}에게 연락하는 방법.` : undefined,
  };
}

type Channel = { label: string; href: string; note: string };

export default async function ContactPage({ params }: PageProps) {
  const { person } = await params;
  const profile = await getProfileBySlug(person);
  if (!profile) notFound();

  // 값이 비어 있는 채널은 목록에서 통째로 빠진다.
  const channels: Channel[] = (
    [
      {
        label: "이메일",
        href: profile.link_email ? `mailto:${profile.link_email}` : "",
        note: "가장 확실한 경로. 협업이나 연구 관련 문의는 여기로.",
      },
      {
        label: "GitHub",
        href: profile.link_github,
        note: "프로젝트 저장소와 진행 중인 코드.",
      },
      {
        label: "블로그",
        href: profile.link_blog,
        note: "작업과 전공 기록.",
      },
      {
        label: "블로그 2",
        href: profile.link_blog2,
        note: "일상과 대외활동 기록.",
      },
      {
        label: "Instagram",
        href: profile.link_instagram,
        note: "일상·창작 활동.",
      },
      {
        label: "LinkedIn",
        href: profile.link_linkedin,
        note: "경력 요약과 이력 관련 문의.",
      },
    ] as Channel[]
  ).filter((c) => Boolean(c.href));

  const refs: RefItem[] = channels.map(({ label, href }) => ({ label, href }));

  const infoRows: InfoRow[] = [
    ...(profile.link_email
      ? [
          {
            label: "이메일",
            value: (
              <a href={`mailto:${profile.link_email}`} className="doc-link break-all">
                {profile.link_email}
              </a>
            ),
          },
        ]
      : []),
    ...(profile.location ? [{ label: "지역", value: profile.location }] : []),
    { label: "채널", value: `${channels.length}개` },
  ];

  const sections: DocSection[] = [
    {
      id: "channels",
      title: "연락 채널",
      body: channels.length ? (
        <dl className="max-w-prose divide-y divide-line-soft border-y border-line">
          {channels.map((channel) => (
            <div key={channel.label} className="py-4">
              <dt className="font-semibold">
                {channel.href.startsWith("mailto:") ? (
                  <a href={channel.href} className="doc-link">
                    {channel.label}
                  </a>
                ) : (
                  <ExternalLink href={channel.href}>{channel.label}</ExternalLink>
                )}
              </dt>
              <dd className="mt-1 text-sm leading-relaxed text-ink-soft">{channel.note}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <EmptyNotice>등록된 연락 채널이 없다.</EmptyNotice>
      ),
    },
    {
      id: "note",
      title: "문의 전 참고",
      body: (
        <div className="max-w-prose space-y-4 leading-[1.85] text-ink-soft">
          <p>
            이 사이트는 개인 작업 아카이브다. 별도의 문의 양식은 두지 않았다. 이메일
            하나로 충분한 규모이기 때문이다.
          </p>
          <p>
            협업이나 연구 관련 문의라면 어떤 문서를 보고 연락하는지 한 줄 적어 주면 답이
            빨라진다.
          </p>
        </div>
      ),
    },
    ...(refs.length
      ? [
          {
            id: "refs",
            title: "링크 목록",
            body: <RefList items={refs} />,
          } satisfies DocSection,
        ]
      : []),
  ];

  return (
    <article>
      <DocHeader
        kicker="연락"
        title="연락처"
        lead={<p>아래 채널 중 편한 곳으로 연락하면 된다.</p>}
      />

      <InfoBox title="연락 개요" rows={infoRows} />

      <Toc sections={sections} />
      <DocSections sections={sections} />
    </article>
  );
}
