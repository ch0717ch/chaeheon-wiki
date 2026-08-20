import Link from "next/link";
import { getProfiles } from "@/lib/queries";
import { docTree, site } from "@/lib/site";

// 대문 — 문서(인물) 목록. 나무위키의 대문에 해당한다.
export const revalidate = 300;

export default async function FrontPage() {
  const profiles = await getProfiles();

  return (
    <div className="mx-auto w-full max-w-3xl px-5 pb-24 sm:px-8">
      <header className="border-b-2 border-rule pb-8 pt-14">
        <p className="eyebrow mb-2">{site.nameEn}</p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{site.name}</h1>
        <p className="mt-4 max-w-prose leading-[1.85] text-ink-soft">{site.tagline}</p>
      </header>

      <main id="main">
        <section aria-labelledby="doc-list" className="mt-10">
          <div className="flex items-baseline justify-between">
            <h2 id="doc-list" className="text-lg font-bold tracking-tight">
              문서 목록
              <span className="ml-2 font-mono text-sm font-normal text-ink-muted">
                {profiles.length}
              </span>
            </h2>
            <Link
              href="/admin?create=1"
              className="no-print font-mono text-xs font-normal text-ink-muted underline-offset-2 hover:text-ink hover:underline"
            >
              [+ 새 문서]
            </Link>
          </div>

          {profiles.length ? (
            <ul className="mt-4 border-t-2 border-rule">
              {profiles.map((p) => (
                <li key={p.id} className="border-b border-line">
                  <Link
                    href={`/${p.slug}`}
                    className="group block py-5 transition-colors hover:bg-paper-deep"
                  >
                    <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <span className="text-lg font-bold tracking-tight text-ink group-hover:underline group-hover:underline-offset-4">
                        {p.name}
                      </span>
                      {/* 열람 공개 여부. 잠긴 문서는 비밀번호를 입력해야 볼 수 있다. */}
                      <span
                        className={`border px-1.5 py-0.5 font-mono text-[0.625rem] font-bold tracking-wider ${
                          p.view_locked
                            ? "border-red-300 bg-red-50 text-red-700"
                            : "border-green-300 bg-green-50 text-green-700"
                        }`}
                      >
                        {p.view_locked ? "PRIVATE" : "PUBLIC"}
                      </span>
                      {p.name_en ? (
                        <span className="text-sm text-ink-muted">{p.name_en}</span>
                      ) : null}
                    </span>
                    {p.title ? (
                      <span className="mt-1 block text-sm leading-relaxed text-ink-soft">
                        {p.title}
                      </span>
                    ) : null}
                    <span className="mt-2 block text-xs text-ink-muted">
                      {docTree.map((d) => d.label).join(" · ")}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 max-w-prose border border-dashed border-line px-4 py-6 text-sm leading-relaxed text-ink-muted">
              아직 문서가 없다. 관리 화면에서 첫 인물 문서를 만들면 여기에 나타난다.
            </p>
          )}
        </section>

        <footer className="mt-20 border-t-2 border-rule pt-6 text-xs leading-relaxed text-ink-muted">
          <p>© {new Date().getFullYear()} {site.name}. 이 사이트는 공개 읽기 전용이다.</p>
          <p className="mt-1">
            <Link href="/admin?create=1" className="doc-link">
              누구나 문서를 만들 수 있다
            </Link>
            . 비밀번호를 설정한 문서는 소유자만 수정하며, PRIVATE 문서는 비밀번호를
            입력해야 열람된다.
          </p>
          {/* 열린 편집 정책 고지 — 대문에서 항상 보이는 짧은 면책 문구 */}
          <p className="mt-2 font-semibold text-red-700">
            비밀번호가 없는 문서는 누구나 수정·삭제할 수 있다. 문서 생성 시 비밀번호
            설정을 권장하며, 미설정 문서의 변형·삭제·수정으로 발생하는 문제는 책임지지
            않는다.
          </p>
        </footer>
      </main>
    </div>
  );
}
