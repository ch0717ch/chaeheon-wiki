import { ExternalLink } from "@/components/Links";
import PdfDownload from "@/components/PdfDownload";

/**
 * 원본 PDF 열람 영역.
 *
 * 별도 PDF 라이브러리를 넣지 않고 브라우저 내장 뷰어를 <iframe> 으로 띄운다.
 * 라이브러리를 쓰면 번들이 수백 KB 늘고 렌더링 차이를 계속 따라가야 하는데,
 * 원본을 그대로 보여주는 것이 목적이라 내장 뷰어가 더 정확하다.
 *
 * 내장 뷰어가 없는 환경(대부분의 모바일 브라우저)에서는 iframe 이 비어 보이므로
 * 새 탭 열기 링크를 항상 함께 둔다.
 */
export default function PdfViewer({
  src,
  title,
}: {
  src: string;
  title: string;
}) {
  return (
    <figure className="max-w-prose">
      <div className="flex flex-wrap items-center justify-between gap-3 border-2 border-rule bg-slab px-4 py-2.5 text-on-slab">
        <span className="text-xs font-bold uppercase tracking-[0.15em]">원본 문서</span>
        <span className="flex items-center gap-3 text-sm font-semibold">
          <a href={src} target="_blank" rel="noopener noreferrer" className="slab-link">
            새 탭에서 열기
            <span className="sr-only"> (새 창에서 열림)</span>
          </a>
          <span aria-hidden className="text-on-slab-muted">
            ·
          </span>
          <PdfDownload href={src} filename={`${title}.pdf`} className="slab-link" />
        </span>
      </div>

      {/* 세로가 긴 문서라 A4 비율에 가깝게 잡되, 모바일에서는 높이를 줄인다. */}
      <iframe
        src={src}
        title={`${title} 원본 PDF`}
        className="h-[60vh] max-h-[46rem] min-h-[22rem] w-full border-x-2 border-b-2 border-rule bg-paper-deep"
      />

      <figcaption className="mt-2 text-xs leading-relaxed text-ink-muted">
        문서가 보이지 않으면 위의 <span className="font-semibold">새 탭에서 열기</span> 를
        누른다. 모바일 브라우저에는 내장 PDF 뷰어가 없는 경우가 있다.
      </figcaption>
    </figure>
  );
}

/** 참조 목록 위에 두는 다운로드 버튼. */
export function PdfButton({ href, label }: { href: string; label: string }) {
  return (
    <ExternalLink
      href={href}
      className="inline-block bg-slab px-4 py-2 font-semibold text-on-slab no-underline hover:bg-slab-soft"
    >
      {label}
    </ExternalLink>
  );
}
