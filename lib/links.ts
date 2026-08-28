import type { Profile } from "@/types";

// =====================================================================
// 인물 문서의 외부 채널 목록을 한 곳에서 만든다.
//
// 채널은 고정 칸(link_github, link_blog …)과 자유 목록(links_extra)에
// 나뉘어 저장된다. 저장 위치가 아니라 종류로 묶어야 화면이 읽히므로,
// 여기서 한 번 정렬해 개요·연락·프로필 카드가 같은 순서를 쓰게 한다.
//
// 순서: 이메일 → GitHub → 블로그 → Instagram → 그 밖
// =====================================================================

export type ChannelKind = "email" | "github" | "blog" | "instagram" | "other";

export type Channel = {
  label: string;
  href: string;
  /** 연락 문서에서 링크 아래 한 줄로 붙는 설명. */
  note: string;
  kind: ChannelKind;
};

const RANK: Record<ChannelKind, number> = {
  email: 0,
  github: 1,
  blog: 2,
  instagram: 3,
  other: 4,
};

/** 주소로 채널 종류를 알아낸다. 자유 목록에는 종류 칸이 없다. */
export function channelKind(url: string): ChannelKind {
  if (url.startsWith("mailto:")) return "email";
  if (/github\.com/i.test(url)) return "github";
  if (/instagram\.com/i.test(url)) return "instagram";
  if (/blog|blogspot|tistory|velog|brunch|medium/i.test(url)) return "blog";
  return "other";
}

export function buildChannels(profile: Profile): Channel[] {
  const fixed: Channel[] = [
    {
      label: "이메일",
      href: profile.link_email ? `mailto:${profile.link_email}` : "",
      note: "가장 확실한 경로. 협업이나 연구 관련 문의는 여기로.",
      kind: "email",
    },
    {
      label: "GitHub",
      href: profile.link_github,
      note: "프로젝트 저장소와 진행 중인 코드.",
      kind: "github",
    },
    {
      label: "네이버 블로그 (작업·전공)",
      href: profile.link_blog,
      note: "작업과 전공 기록.",
      kind: "blog",
    },
    {
      label: "네이버 블로그 (일상)",
      href: profile.link_blog2,
      note: "일상과 대외활동 기록.",
      kind: "blog",
    },
    {
      label: "Instagram (일상)",
      href: profile.link_instagram,
      note: "일상·창작 활동.",
      kind: "instagram",
    },
    {
      label: "LinkedIn",
      href: profile.link_linkedin,
      note: "경력 요약과 이력 관련 문의.",
      kind: "other",
    },
  ];

  const extra: Channel[] = (profile.links_extra ?? []).map((link) => ({
    label: link.label,
    href: link.url,
    note: link.note ?? "",
    kind: channelKind(link.url),
  }));

  // 종류로 묶되, 같은 종류 안에서는 넣은 순서를 지킨다.
  return [...fixed, ...extra]
    .filter((c) => Boolean(c.href))
    .map((c, i) => ({ c, i }))
    .sort((a, b) => RANK[a.c.kind] - RANK[b.c.kind] || a.i - b.i)
    .map(({ c }) => c);
}
