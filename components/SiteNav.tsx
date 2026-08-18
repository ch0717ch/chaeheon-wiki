"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import MusicPlayer from "@/components/MusicPlayer";
import { docTree, site } from "@/lib/site";

/**
 * 인물 문서의 좌측 트리. 위키의 사이드바 역할이다.
 * 어떤 인물의 문서인지는 props 로 받는다 — 이 컴포넌트는 DB 를 모른다.
 */
export default function SiteNav({
  person,
  name,
  title,
  musicUrl = "",
  musicTitle = "",
}: {
  person: string; // 인물 slug
  name: string;
  title: string;
  /** 문서 배경음악. 비어 있으면 재생 버튼을 그리지 않는다. */
  musicUrl?: string;
  musicTitle?: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // 문서를 이동하면 모바일 메뉴를 닫는다. 열린 채로 남으면 본문을 가린다.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const base = `/${person}`;
  const isActive = (href: string) => {
    const full = `${base}${href}`;
    return href === "" ? pathname === full : pathname.startsWith(full);
  };

  return (
    <>
      {/* ---------------- 모바일 상단 바 ---------------- */}
      <header className="no-print sticky top-0 z-30 bg-slab text-on-slab lg:hidden">
        <div className="flex items-center justify-between px-5 py-3">
          <Link href={base} className="text-sm font-bold tracking-tight">
            {name}
            <span className="ml-2 font-normal text-on-slab-muted">{site.name}</span>
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="site-nav-list"
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
                    href={`${base}${doc.href}`}
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
              <li>
                <Link
                  href="/"
                  className="flex items-baseline gap-2 py-3 text-[0.95rem] text-on-slab-muted"
                >
                  <span>대문</span>
                  <span className="text-xs">문서 전체 목록</span>
                </Link>
              </li>
            </ul>
          </nav>
        )}
      </header>

      {/* ---------------- 데스크톱 사이드바 ---------------- */}
      <aside className="no-print hidden w-64 shrink-0 bg-slab text-on-slab lg:block">
        <div className="sticky top-0 flex max-h-screen flex-col overflow-y-auto px-7 py-10">
          <Link href="/" className="eyebrow block text-on-slab-muted hover:text-on-slab">
            {site.name} ▸ 대문
          </Link>

          <Link href={base} className="mt-4 block">
            <span className="block text-lg font-bold tracking-tight">{name}</span>
            {title ? (
              <span className="mt-1 block text-xs leading-relaxed text-on-slab-muted">
                {title}
              </span>
            ) : null}
          </Link>

          {/* 문서별 배경음악. PC 사이드바에만 둔다 — 모바일 상단 바는 자리가 없다. */}
          {musicUrl ? (
            <div className="mt-5">
              <MusicPlayer src={musicUrl} title={musicTitle} variant="slab" />
            </div>
          ) : null}

          <nav aria-label="문서 목록" className="mt-8">
            <p className="mb-3 text-[0.6875rem] font-bold uppercase tracking-[0.2em] text-on-slab-muted">
              문서
            </p>
            <ul className="border-t border-slab-soft">
              {docTree.map((doc) => (
                <li key={doc.href} className="border-b border-slab-soft">
                  <Link
                    href={`${base}${doc.href}`}
                    aria-current={isActive(doc.href) ? "page" : undefined}
                    className={`block py-2.5 text-sm transition-colors ${
                      isActive(doc.href)
                        ? "font-bold text-on-slab"
                        : "text-on-slab-muted hover:text-on-slab"
                    }`}
                  >
                    <span className="flex items-baseline gap-2">
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
            {site.nameEn}
            <br />
            개인 작업 아카이브
          </p>
        </div>
      </aside>
    </>
  );
}
