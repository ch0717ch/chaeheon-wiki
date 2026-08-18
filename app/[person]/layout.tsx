import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SiteNav from "@/components/SiteNav";
import { stripFootnotes } from "@/lib/footnotes";
import { getProfileBySlug, getProfiles } from "@/lib/queries";
import { site } from "@/lib/site";

export const revalidate = 300;

type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{ person: string }>;
};

export async function generateStaticParams() {
  const profiles = await getProfiles();
  return profiles.map((p) => ({ person: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ person: string }>;
}): Promise<Metadata> {
  const { person } = await params;
  const profile = await getProfileBySlug(person);
  if (!profile) return { title: "문서 없음" };

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
