import type { ReactNode } from "react";
import { BlogIcon, GithubIcon, InstagramIcon, MailIcon } from "@/components/Icons";
import ProfilePhoto from "@/components/ProfilePhoto";
import { site } from "@/lib/site";

type Row = { label: string; value: ReactNode };

/** 값이 있는 링크만 아이콘 줄에 세운다. */
const socialLinks = [
  { key: "github", href: site.links.github, label: "GitHub", Icon: GithubIcon },
  { key: "blog", href: site.links.blog, label: "블로그 (IT)", Icon: BlogIcon },
  {
    key: "blogPersonal",
    href: site.links.blogPersonal,
    label: "블로그 (일상)",
    Icon: BlogIcon,
  },
  { key: "instagram", href: site.links.instagram, label: "Instagram", Icon: InstagramIcon },
  {
    key: "email",
    href: site.links.email ? `mailto:${site.links.email}` : "",
    label: "이메일",
    Icon: MailIcon,
  },
].filter((l) => Boolean(l.href));

/**
 * 위키 인물 문서의 프로필 상자.
 * 사진 → 이름 → 항목표 → 아이콘 링크 순서로, 한눈에 사람을 파악하는 용도다.
 */
export default function ProfileCard() {
  const rows: Row[] = [
    { label: "이름", value: `${site.name} (${site.nameEn})` },
    // 값이 비어 있는 줄은 표에서 통째로 뺀다. 빈 칸을 남기면 미완성으로 보인다.
    ...(site.birthDate ? [{ label: "생년월일", value: site.birthDate }] : []),
    { label: "주 분야", value: site.fieldMain },
    { label: "부 분야", value: site.fieldSub },
    {
      label: "학력",
      value: (
        <ul className="space-y-0.5">
          {site.educationSummary.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      ),
    },
    { label: "언어", value: site.languages },
    { label: "MBTI", value: site.mbti },
    { label: "지역", value: site.location },
  ];

  return (
    <aside
      aria-label="프로필"
      className="my-8 border-2 border-rule bg-card text-sm lg:float-right lg:my-0 lg:ml-8 lg:w-80 lg:max-w-[46%]"
    >
      <p className="bg-slab px-4 py-2 text-xs font-bold uppercase tracking-[0.15em] text-on-slab">
        프로필
      </p>

      <div className="flex justify-center border-b border-line px-4 py-5">
        <ProfilePhoto className="w-32" />
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
                    // 터치 목표 44px 확보. 아이콘만 있으므로 라벨은 sr-only 로 남긴다.
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
