import Link from "next/link";
import { prettyUrl } from "@/lib/format";

/**
 * 외부 링크. 새 탭으로 열되 스크린리더에 그 사실을 알린다.
 * rel="noopener" 는 새 탭이 원본 창을 조작하지 못하게 막는다.
 */
export function ExternalLink({
  href,
  children,
  className = "",
}: {
  href: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`doc-link ${className}`}
    >
      {children ?? prettyUrl(href)}
      <span className="sr-only"> (새 창에서 열림)</span>
    </a>
  );
}

export type RefItem = { label: string; href: string };

/**
 * 위키 문서 하단의 참조 목록. 번호가 붙어 본문에서 [1] 로 가리킬 수 있다.
 * mailto: 와 내부 경로는 새 탭으로 열지 않는다.
 */
export function RefList({ items }: { items: RefItem[] }) {
  if (!items.length) return null;

  return (
    <ol className="space-y-2">
      {items.map((item, i) => {
        const isExternal = /^https?:\/\//.test(item.href);
        const isMail = item.href.startsWith("mailto:");

        return (
          <li key={item.href + i} className="grid grid-cols-[2rem_1fr] items-baseline">
            <span className="sec-num">[{i + 1}]</span>
            <span className="text-sm leading-relaxed">
              <span className="text-ink-muted">{item.label} · </span>
              {isExternal ? (
                <ExternalLink href={item.href} />
              ) : isMail ? (
                <a href={item.href} className="doc-link">
                  {item.href.replace("mailto:", "")}
                </a>
              ) : (
                <Link href={item.href} className="doc-link">
                  {item.href}
                </Link>
              )}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
