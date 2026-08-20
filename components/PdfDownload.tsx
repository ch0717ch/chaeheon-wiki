/**
 * PDF 저장(다운로드) 링크.
 *
 * 브라우저는 PDF 링크를 누르면 저장이 아니라 열기를 한다. 저장시키는 방법이
 * 출처에 따라 다르다:
 *   - Supabase Storage 공개 URL → ?download=파일명 을 붙이면 서버가
 *     Content-Disposition: attachment 로 응답해 바로 저장된다.
 *   - 같은 출처(/docs/..) → <a download> 속성이 동작한다.
 *     (download 속성은 다른 출처에서는 무시되므로 위 방식과 나눈다)
 */

/** 파일명으로 못 쓰는 문자를 지운다. */
function sanitize(name: string): string {
  return name.replace(/[\\/:*?"<>|]/g, " ").replace(/\s+/g, " ").trim();
}

export function pdfDownloadHref(url: string, filename?: string): string {
  if (url.includes("/storage/v1/object/public/")) {
    const sep = url.includes("?") ? "&" : "?";
    return `${url}${sep}download${filename ? `=${encodeURIComponent(sanitize(filename))}` : ""}`;
  }
  return url;
}

export default function PdfDownload({
  href,
  filename,
  className = "doc-link",
  children,
}: {
  href: string;
  /** 저장될 파일 이름. 예: "임채헌 이력서.pdf" */
  filename?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  const sameOrigin = !/^https?:\/\//i.test(href);
  return (
    <a
      href={pdfDownloadHref(href, filename)}
      download={sameOrigin ? (filename ? sanitize(filename) : true) : undefined}
      className={className}
    >
      {children ?? "다운로드"}
      <span className="sr-only"> (PDF 파일 저장)</span>
    </a>
  );
}
