import Link from "next/link";
import { site } from "@/lib/site";

export default function NotFound() {
  return (
    <main id="main" className="mx-auto w-full max-w-3xl px-5 pb-24 pt-14 sm:px-8">
      <header className="border-b-2 border-rule pb-6">
        <p className="eyebrow mb-2">404</p>
        <h1 className="text-2xl font-bold tracking-tight sm:text-[2rem]">
          문서를 찾을 수 없다
        </h1>
        <p className="mt-4 max-w-prose leading-[1.85] text-ink-soft">
          주소가 잘못되었거나, 해당 문서가 아직 공개되지 않았다.
        </p>
      </header>

      <p className="mt-8">
        <Link href="/" className="doc-link font-semibold">
          ← {site.name} 대문으로
        </Link>
      </p>
    </main>
  );
}
