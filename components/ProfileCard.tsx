import type { ReactNode } from "react";
import { FnText } from "@/components/Footnotes";
import { BlogIcon, GithubIcon, InstagramIcon, MailIcon } from "@/components/Icons";
import ProfilePhoto from "@/components/ProfilePhoto";
import type { FootnoteRegistry } from "@/lib/footnotes";
import type { Profile } from "@/types";

type Row = { label: string; value: ReactNode };

/**
 * 위키 인물 문서의 프로필 상자.
 * 사진 → 이름 → 항목표 → 아이콘 링크 순서로, 한눈에 사람을 파악하는 용도다.
 * 값이 비어 있는 행은 표에서 통째로 뺀다. 빈 칸을 남기면 미완성으로 보인다.
 *
 * 모든 값은 FnText 를 거치므로 MBTI 같은 짧은 칸에도 [*각주] 를 쓸 수 있다.
 */
export default function ProfileCard({
  profile,
  fn,
}: {
  profile: Profile;
  fn?: FootnoteRegistry;
}) {
  // 짧은 값도 각주 문법이 살아나도록 전부 이 함수를 거친다.
  const T = (s: string) => <FnText text={s} registry={fn} />;
  const socialLinks = [
    { key: "github", href: profile.link_github, label: "GitHub", Icon: GithubIcon },
    { key: "blog", href: profile.link_blog, label: "블로그", Icon: BlogIcon },
    { key: "blog2", href: profile.link_blog2, label: "블로그 2", Icon: BlogIcon },
    {
      key: "instagram",
      href: profile.link_instagram,
      label: "Instagram",
      Icon: InstagramIcon,
    },
    // 추가 채널. 주소로 종류를 알아내 같은 아이콘 체계에 태운다.
    ...(profile.links_extra ?? []).map((link, i) => ({
      key: `extra-${i}`,
      href: link.url,
      label: link.label,
      Icon: /instagram\.com/i.test(link.url)
        ? InstagramIcon
        : /github\.com/i.test(link.url)
          ? GithubIcon
          : BlogIcon,
    })),
    {
      key: "email",
      href: profile.link_email ? `mailto:${profile.link_email}` : "",
      label: "이메일",
      Icon: MailIcon,
    },
  ].filter((l) => Boolean(l.href));

  const rows: Row[] = (
    [
      {
        label: "이름",
        value: T(profile.name_en ? `${profile.name} (${profile.name_en})` : profile.name),
      },
      profile.birth_date ? { label: "생년월일", value: T(profile.birth_date) } : null,
      profile.field_main ? { label: "주 분야", value: T(profile.field_main) } : null,
      profile.field_sub ? { label: "부 분야", value: T(profile.field_sub) } : null,
      profile.education_summary.length
        ? {
            label: "학력",
            value: (
              <ul className="space-y-0.5">
                {profile.education_summary.map((line) => (
                  <li key={line}>{T(line)}</li>
                ))}
              </ul>
            ),
          }
        : null,
      profile.languages ? { label: "언어", value: T(profile.languages) } : null,
      profile.mbti ? { label: "MBTI", value: T(profile.mbti) } : null,
      profile.location ? { label: "지역", value: T(profile.location) } : null,
    ] as (Row | null)[]
  ).filter((r): r is Row => r !== null);

  return (
    <aside
      aria-label="프로필"
      className="my-8 border-2 border-rule bg-card text-sm lg:float-right lg:my-0 lg:ml-8 lg:w-80 lg:max-w-[46%]"
    >
      <p className="bg-slab px-4 py-2 text-xs font-bold uppercase tracking-[0.15em] text-on-slab">
        프로필
      </p>

      <div className="flex justify-center border-b border-line px-4 py-5">
        {/* 폭은 이 래퍼가 정하고, 사진은 그 안을 채운다. */}
        <div className="w-36">
          <ProfilePhoto photoUrl={profile.photo_url} name={profile.name} />
        </div>
      </div>

      <dl className="divide-y divide-line-soft">
        {rows.map((row) => (
          <div key={row.label} className="grid grid-cols-[3.5rem_1fr] gap-3 px-4 py-2.5">
            <dt className="text-xs font-semibold leading-6 text-ink-muted">{row.label}</dt>
            <dd className="leading-6 text-ink">{row.value}</dd>
          </div>
        ))}
      </dl>

      {socialLinks.length ? (
        <div className="border-t border-line px-4 py-3">
          <p className="mb-2 text-xs font-semibold text-ink-muted">링크</p>
          <ul className="flex flex-wrap gap-2">
            {socialLinks.map(({ key, href, label, Icon }) => {
              const isMail = href.startsWith("mailto:");
              return (
                <li key={key}>
                  <a
                    href={href}
                    {...(isMail ? {} : { target: "_blank", rel: "noopener noreferrer" })}
                    title={label}
                    className="flex h-11 w-11 items-center justify-center border border-line bg-paper text-ink transition-colors hover:bg-slab hover:text-on-slab"
                  >
                    <Icon />
                    <span className="sr-only">
                      {label}
                      {isMail ? "" : " (새 창에서 열림)"}
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </aside>
  );
}
