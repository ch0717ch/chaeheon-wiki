"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { docTree, site } from "@/lib/site";

/**
 * 좌측 문서 트리. 위키의 사이드바 역할이다.
 * 데스크톱에서는 고정 사이드바, 모바일에서는 상단 바 + 접이식 목록으로 바뀐다.
 */
export default function SiteNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // 문서를 이동하면 모바일 메뉴를 닫는다. 열린 채로 남으면 본문을 가린다.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      {/* ---------------- 모바일 상단 바 ---------------- */}
      <header className="no-print sticky top-0 z-30 border-b border-line bg-paper/95 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between px-5 py-3">
          <Link href="/" className="text-sm font-bold tracking-tight text-ink">
            {site.name}
            <span className="ml-2 font-normal text-ink-muted">아카이브</span>
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="site-nav-list"
            // 터치 목표를 44px 이상으로 잡는다. 그보다 작으면 오탭이 늘어난다.
            className="-mr-2 flex min-h-11 min-w-11 items-center justify-center rounded px-3 text-sm font-medium text-ink-soft"
          >
            {open ? "닫기" : "목차"}
          </button>
        </div>

        {open && (
          <nav
            id="site-nav-list"
            aria-label="문서 목록"
            className="border-t border-line-soft px-5 pb-4 pt-2"
          >
            <ul>
              {docTree.map((doc) => (
                <li key={doc.href}>
                  <Link
                    href={doc.href}
                    aria-current={isActive(doc.href) ? "page" : undefined}
                    className={`flex items-baseline gap-2 border-b border-line-soft py-3 text-[0.95rem] ${
                      isActive(doc.href) ? "font-bold text-accent" : "text-ink-soft"
                    }`}
                  >
                    <span>{doc.label}</span>
                    <span className="text-xs text-ink-muted">{doc.note}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </header>

      {/* ---------------- 데스크톱 사이드바 ---------------- */}
      <aside className="no-print hidden w-60 shrink-0 border-r border-line lg:block">
        <div className="sticky top-0 flex max-h-screen flex-col overflow-y-auto px-6 py-10">
          <Link href="/" className="block">
            <span className="block text-base font-bold tracking-tight text-ink">
              {site.name}
            </span>
            <span className="mt-0.5 block text-xs text-ink-muted">{site.title}</span>
          </Link>

          <nav aria-label="문서 목록" className="mt-8">
            <p className="eyebrow mb-3">문서</p>
            <ul className="space-y-px">
              {docTree.map((doc) => (
                <li key={doc.href}>
                  <Link
                    href={doc.href}
                    aria-current={isActive(doc.href) ? "page" : undefined}
                    className={`block border-l-2 py-1.5 pl-3 text-sm transition-colors ${
                      isActive(doc.href)
                        ? "border-accent font-bold text-accent"
                        : "border-transparent text-ink-soft hover:border-line hover:text-ink"
                    }`}
                  >
                    {doc.label}
                    <span className="mt-0.5 block text-xs font-normal text-ink-muted">
                      {doc.note}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <p className="mt-auto pt-10 text-xs leading-relaxed text-ink-muted">
            개인 작업 아카이브
            <br />
            마지막 갱신 기준은 각 문서 하단에 있다.
          </p>
        </div>
      </aside>
    </>
  );
}
