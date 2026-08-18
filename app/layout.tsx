import type { Metadata, Viewport } from "next";
import { site } from "@/lib/site";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || site.fallbackUrl;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${site.name} — 개인 작업 아카이브`,
    template: `%s — ${site.name}`,
  },
  description: site.tagline,
  // 링크 공유 썸네일. 이게 없으면 카톡 등이 페이지의 첫 큰 이미지
  // (프로필 사진)를 집어간다.
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: site.name,
    title: `${site.name} — 개인 작업 아카이브`,
    description: site.tagline,
    images: [{ url: "/og.png", width: 1200, height: 630, alt: site.name }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og.png"],
  },
  // 링크를 직접 받은 사람만 보도록 검색 색인을 막는다.
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
        {children}
      </body>
    </html>
  );
}
