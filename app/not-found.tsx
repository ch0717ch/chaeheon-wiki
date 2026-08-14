import Link from "next/link";
import { docTree } from "@/lib/site";

export default function NotFound() {
  return (
    <article>
      <header className="border-b border-line pb-6">
        <p className="eyebrow mb-2">404</p>
        <h1 className="text-2xl font-bold tracking-tight sm:text-[2rem]">
          문서를 찾을 수 없다
        </h1>
        <p className="mt-4 max-w-prose leading-[1.85] text-ink-soft">
          주소가 잘못되었거나, 해당 문서가 아직 공개되지 않았다. 아래 목록에서 원하는
          문서를 골라 이동한다.
        </p>
      </header>

      <nav aria-label="문서 목록" className="mt-8">
        <ul className="max-w-prose divide-y divide-line-soft border-y border-line">
          {docTree.map((doc) => (
            <li key={doc.href} className="grid grid-cols-[5rem_1fr] gap-4 py-3">
              <Link href={doc.href} className="doc-link font-semibold">
                {doc.label}
              </Link>
              <span className="text-sm leading-relaxed text-ink-soft">{doc.note}</span>
            </li>
          ))}
        </ul>
      </nav>
    </article>
  );
}
