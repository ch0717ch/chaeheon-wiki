import type { ReactNode } from "react";

export type InfoRow = { label: string; value: ReactNode };

/**
 * 위키 문서 우상단의 개요 상자.
 * 데스크톱에서는 본문 오른쪽에 띄우고, 모바일에서는 본문 위에 전체 폭으로 눕힌다.
 * 값이 비어 있는 행은 넘겨받기 전에 걸러내는 것을 전제로 한다.
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
      className="my-8 border border-line bg-surface text-sm lg:float-right lg:my-0 lg:ml-8 lg:w-72 lg:max-w-[45%]"
    >
      <p className="border-b border-line px-4 py-2.5 text-xs font-bold tracking-wide text-accent">
        {title}
      </p>
      <dl className="divide-y divide-line-soft">
        {rows.map((row) => (
          <div key={row.label} className="grid grid-cols-[5.5rem_1fr] gap-3 px-4 py-2.5">
            <dt className="text-xs font-semibold leading-6 text-ink-muted">{row.label}</dt>
            <dd className="leading-6 text-ink">{row.value}</dd>
          </div>
        ))}
      </dl>
      {footer ? (
        <div className="border-t border-line px-4 py-3 text-xs text-ink-muted">{footer}</div>
      ) : null}
    </aside>
  );
}
