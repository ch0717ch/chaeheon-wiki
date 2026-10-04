import type { Metadata } from "next";
import { notFound } from "next/navigation";
import DocLockGate from "@/components/DocLockGate";
import SiteNav from "@/components/SiteNav";
import { canViewProfile } from "@/lib/docAccess";
import { stripFootnotes } from "@/lib/footnotes";
import { getProfileBySlug } from "@/lib/queries";
import { site } from "@/lib/site";

// 인물 페이지는 동적 렌더로 강제한다. 잠긴 문서의 열람 판정이 쿠키를
// 읽어야 하는데, 정적 생성(ISR) 중에는 쿠키 접근이 불가능해 프로덕션에서
// 500 이 났다. 동적 전환의 부수 효과로 수정이 캐시 지연 없이 즉시 보인다.
export const dynamic = "force-dynamic";

type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{ person: string }>;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ person: string }>;
}): Promise<Metadata> {
  const { person } = await params;
  const profile = await getProfileBySlug(person);
  if (!profile) return { title: "문서 없음" };

  // 잠긴 문서는 메타데이터로도 내용을 흘리지 않는다.
  if (profile.view_locked) {
    return { title: `${profile.name} (잠긴 문서)`, description: undefined };
  }

  return {
    title: {
      default: `${profile.name} — ${profile.title || site.name}`,
      template: `%s — ${profile.name}`,
    },
    description: stripFootnotes(profile.intro) || undefined,
    openGraph: {
      type: "profile",
      locale: "ko_KR",
      siteName: site.name,
      title: `${profile.name} — ${profile.title}`,
      description: stripFootnotes(profile.intro) || undefined,
      // 하위 openGraph 는 루트를 통째로 대체하므로 썸네일을 다시 지정한다.
      // 얼굴 사진이 아니라 사이트 명패가 썸네일로 나가야 한다.
      images: [{ url: "/og.png", width: 1200, height: 630, alt: site.name }],
    },
    twitter: { card: "summary_large_image", images: ["/og.png"] },
  };
}

export default async function PersonLayout({ children, params }: LayoutProps) {
  const { person } = await params;
  const profile = await getProfileBySlug(person);
  if (!profile) notFound();

  // 잠긴 문서: 마스터 세션 또는 이 문서의 비밀번호 세션이 있어야 본다.
  // 각 페이지도 같은 판정으로 본문을 만들지 않는다(lib/docAccess 참고).
  if (!(await canViewProfile(profile))) {
    return <DocLockGate person={profile.slug} name={profile.name} />;
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col lg:flex-row">
      <SiteNav
        person={profile.slug}
        name={profile.name}
        title={profile.title}
        musicUrl={profile.music_url}
        musicTitle={profile.music_title}
      />

      <main id="main" className="min-w-0 flex-1 px-5 pb-24 pt-8 sm:px-8 lg:px-12 lg:pt-14">
        {children}

        <footer className="mt-20 border-t-2 border-rule pt-6 text-xs leading-relaxed text-ink-muted">
          <p>
            © {new Date().getFullYear()} {site.name} — {profile.name} 문서.
          </p>
          <p className="mt-1">이 사이트는 공개 읽기 전용이다.</p>
        </footer>
      </main>
    </div>
  );
}
