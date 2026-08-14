import type { Metadata } from "next";
import InfoBox, { type InfoRow } from "@/components/InfoBox";
import { ExternalLink, RefList, type RefItem } from "@/components/Links";
import { EmptyNotice } from "@/components/Prose";
import { DocHeader, DocSections, Toc, type DocSection } from "@/components/WikiDoc";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "연락",
  description: `${site.name}에게 연락하는 방법과 외부 프로필 링크.`,
};

type Channel = { label: string; href: string; note: string };

export default function ContactPage() {
  // 값이 비어 있는 채널은 목록에서 통째로 빠진다.
  const channels: Channel[] = (
    [
      {
        label: "이메일",
        href: site.links.email ? `mailto:${site.links.email}` : "",
        note: "가장 확실한 경로. 협업이나 연구 관련 문의는 여기로.",
      },
      {
        label: "GitHub",
        href: site.links.github,
        note: "프로젝트 저장소와 진행 중인 코드.",
      },
      {
        label: "블로그 (IT)",
        href: site.links.blog,
        note: "개발·자동화 작업 기록.",
      },
      {
        label: "블로그 (일상)",
        href: site.links.blogPersonal,
        note: "일상과 대외활동 기록.",
      },
      {
        label: "Instagram",
        href: site.links.instagram,
        note: site.linkNotes.instagram,
      },
      {
        label: "LinkedIn",
        href: site.links.linkedin,
        note: "경력 요약과 이력 관련 문의.",
      },
    ] as Channel[]
  ).filter((c) => Boolean(c.href));

  const refs: RefItem[] = channels.map(({ label, href }) => ({ label, href }));

  const infoRows: InfoRow[] = [
    ...(site.links.email
      ? [
          {
            label: "이메일",
            value: (
              <a href={`mailto:${site.links.email}`} className="doc-link break-all">
                {site.links.email}
              </a>
            ),
          },
        ]
      : []),
    { label: "지역", value: site.location },
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
        <EmptyNotice>
          <code>lib/site.ts</code> 의 <code>links</code> 값을 채우면 연락 채널이 여기에
          표시된다.
        </EmptyNotice>
      ),
    },
    {
      id: "note",
      title: "문의 전 참고",
      body: (
        <div className="max-w-prose space-y-4 leading-[1.85] text-ink-soft">
          <p>
            이 사이트는 개인 작업 아카이브다. 별도의 문의 양식은 두지 않았다. 폼을 만들면
            받는 쪽에도 보내는 쪽에도 관리할 것이 하나 늘어나는데, 이메일 하나로 충분한
            규모이기 때문이다.
          </p>
          <p>
            협업이나 연구 관련 문의라면 어떤 문서를 보고 연락하는지 한 줄 적어 주면 답이
            빨라진다.
          </p>
        </div>
      ),
    },
    {
      id: "refs",
      title: "링크 목록",
      body: refs.length ? <RefList items={refs} /> : <EmptyNotice>등록된 링크가 없다.</EmptyNotice>,
    },
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
