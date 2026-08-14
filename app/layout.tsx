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
  // 링크를 직접 받은 사람만 보도록 검색 색인을 막는다.
  // 공개 URL이지만 생년월일·학력·경력과 개인 문서가 검색에 걸리는 것은 원치 않는다.
  // 노출을 원하게 되면 여기와 app/robots.ts 두 곳을 함께 바꾼다.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#131313",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        {/* 키보드 사용자가 내비게이션을 건너뛰고 본문으로 갈 수 있게 한다. */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-slab focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-on-slab"
        >
          본문으로 건너뛰기
        </a>

        <div className="mx-auto flex w-full max-w-6xl flex-col lg:flex-row">
          <SiteNav />

          <main id="main" className="min-w-0 flex-1 px-5 pb-24 pt-8 sm:px-8 lg:px-12 lg:pt-14">
            {children}

            <footer className="mt-20 border-t-2 border-rule pt-6 text-xs leading-relaxed text-ink-muted">
              <p>
                © {new Date().getFullYear()} {site.name} ({site.nameEn}). 개인 작업 아카이브.
              </p>
              <p className="mt-1">이 사이트는 공개 읽기 전용이다.</p>
            </footer>
          </main>
        </div>
      </body>
    </html>
  );
}
