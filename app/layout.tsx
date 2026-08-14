import type { Metadata, Viewport } from "next";
import SiteNav from "@/components/SiteNav";
import { site } from "@/lib/site";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:7799";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${site.name} — ${site.title}`,
    template: `%s — ${site.name}`,
  },
  description: site.intro,
  keywords: [...site.keywords],
  authors: [{ name: site.name }],
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: `${site.name} 아카이브`,
    title: `${site.name} — ${site.title}`,
    description: site.intro,
    url: siteUrl,
  },
  // 공개 허브이므로 검색 노출을 허용한다.
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1f3a5f",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        {/* 키보드 사용자가 내비게이션을 건너뛰고 본문으로 갈 수 있게 한다. */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:border focus:border-accent focus:bg-paper focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-accent"
        >
          본문으로 건너뛰기
        </a>

        <div className="mx-auto flex w-full max-w-6xl flex-col lg:flex-row">
          <SiteNav />

          <main id="main" className="min-w-0 flex-1 px-5 pb-24 pt-8 sm:px-8 lg:px-12 lg:pt-14">
            {children}

            <footer className="mt-20 border-t border-line pt-6 text-xs leading-relaxed text-ink-muted">
              <p>
                © {new Date().getFullYear()} {site.name}. 개인 작업 아카이브.
              </p>
              <p className="mt-1">
                내용은 Supabase 에 저장되어 있으며 이 사이트는 읽기 전용이다.
              </p>
            </footer>
          </main>
        </div>
      </body>
    </html>
  );
}
