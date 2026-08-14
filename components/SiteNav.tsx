"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { docTree, site } from "@/lib/site";

/**
 * 좌측 문서 트리. 위키의 사이드바 역할이다.
 * 먹지(near-black)로 깔아 본문의 종이색과 면을 나눈다. 화면 왼쪽이
 * 검게 잡혀 있어야 흰 여백이 넓게 남는 인상이 사라진다.
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
      <header className="no-print sticky top-0 z-30 bg-slab text-on-slab lg:hidden">
        <div className="flex items-center justify-between px-5 py-3">
          <Link href="/" className="text-sm font-bold tracking-tight">
            {site.name}
            <span className="ml-2 font-normal text-on-slab-muted">아카이브</span>
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="site-nav-list"
            // 터치 목표를 44px 이상으로 잡는다. 그보다 작으면 오탭이 늘어난다.
            className="-mr-2 flex min-h-11 min-w-11 items-center justify-center px-2 text-sm font-semibold"
          >
            {open ? "닫기" : "목차"}
          </button>
        </div>

        {open && (
          <nav
            id="site-nav-list"
            aria-label="문서 목록"
            className="border-t border-slab-soft px-5 pb-4"
          >
            <ul>
              {docTree.map((doc) => (
                <li key={doc.href}>
                  <Link
                    href={doc.href}
                    aria-current={isActive(doc.href) ? "page" : undefined}
                    className={`flex items-baseline gap-2 border-b border-slab-soft py-3 text-[0.95rem] ${
                      isActive(doc.href) ? "font-bold text-on-slab" : "text-on-slab-muted"
                    }`}
                  >
                    <span>{doc.label}</span>
                    <span className="text-xs text-on-slab-muted">{doc.note}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </header>

      {/* ---------------- 데스크톱 사이드바 ---------------- */}
      <aside className="no-print hidden w-64 shrink-0 bg-slab text-on-slab lg:block">
        <div className="sticky top-0 flex max-h-screen flex-col overflow-y-auto px-7 py-10">
          {/* 사진은 개요 문서의 프로필 상자에만 둔다. 같은 사진이 사이드바에도
              있으면 모든 문서에서 중복 노출되어 시선이 분산된다. */}
          <Link href="/" className="block">
            <span className="block text-lg font-bold tracking-tight">{site.name}</span>
            <span className="mt-1 block text-xs leading-relaxed text-on-slab-muted">
              {site.title}
            </span>
          </Link>

          <nav aria-label="문서 목록" className="mt-9">
            <p className="mb-3 text-[0.6875rem] font-bold uppercase tracking-[0.2em] text-on-slab-muted">
              문서
            </p>
            <ul className="border-t border-slab-soft">
              {docTree.map((doc) => (
                <li key={doc.href} className="border-b border-slab-soft">
                  <Link
                    href={doc.href}
                    aria-current={isActive(doc.href) ? "page" : undefined}
                    className={`block py-2.5 text-sm transition-colors ${
                      isActive(doc.href)
                        ? "font-bold text-on-slab"
                        : "text-on-slab-muted hover:text-on-slab"
                    }`}
                  >
                    <span className="flex items-baseline gap-2">
                      {/* 활성 문서에만 표식을 둔다. 색을 못 쓰니 기호로 구분한다. */}
                      <span aria-hidden className="font-mono text-xs">
                        {isActive(doc.href) ? "▪" : "·"}
                      </span>
                      {doc.label}
                    </span>
                    <span className="mt-0.5 block pl-5 text-xs font-normal text-on-slab-muted">
                      {doc.note}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <p className="mt-auto pt-10 text-xs leading-relaxed text-on-slab-muted">
            개인 작업 아카이브
            <br />
            {site.location}
          </p>
        </div>
      </aside>
    </>
  );
}
