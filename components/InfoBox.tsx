import type { ReactNode } from "react";

export type InfoRow = { label: string; value: ReactNode };

/**
 * 위키 문서 우상단의 개요 상자.
 * 데스크톱에서는 본문 오른쪽에 띄우고, 모바일에서는 본문 위에 전체 폭으로 눕힌다.
 * 머리글을 먹지로 반전시켜 색 없이도 상자가 또렷하게 잡히도록 했다.
 */
export default function InfoBox({
  title,
  rows,
  footer,
}: {
  title: string;
  rows: InfoRow[];
  footer?: ReactNode;
}) {
  if (!rows.length && !footer) return null;

  return (
    <aside
      aria-label={`${title} 개요`}
      className="my-8 border-2 border-rule bg-card text-sm lg:float-right lg:my-0 lg:ml-8 lg:w-72 lg:max-w-[45%]"
    >
      <p className="bg-slab px-4 py-2 text-xs font-bold tracking-[0.15em] text-on-slab uppercase">
        {title}
      </p>
      <dl className="divide-y divide-line-soft">
        {rows.map((row) => (
          <div key={row.label} className="grid grid-cols-[5rem_1fr] gap-3 px-4 py-2.5">
            <dt className="text-xs font-semibold leading-6 text-ink-muted">{row.label}</dt>
            <dd className="leading-6 text-ink">{row.value}</dd>
          </div>
        ))}
      </dl>
      {footer ? (
        <div className="border-t border-line px-4 py-3 text-xs leading-relaxed text-ink-muted">
          {footer}
        </div>
      ) : null}
    </aside>
  );
}
