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

/** URL 의 확장자를 대문자로. 화면의 형식 표시(PPTX·DOCX…)에 쓴다. */
export function fileKind(url: string): string {
  const ext = url.split("?")[0].split("#")[0].split(".").pop() ?? "";
  return /^[a-z0-9]{2,5}$/i.test(ext) ? ext.toUpperCase() : "파일";
}

/**
 * 저장될 이름을 만든다. 업로드된 파일은 이름이 무작위 문자열이라
 * 그대로 받으면 무슨 파일인지 알 수 없다. 확장자만 원본에서 살린다.
 */
export function attachmentFilename(url: string, label?: string | null, fallback = "첨부"): string {
  const ext = fileKind(url).toLowerCase();
  const base = (label || `${fallback} 작업물`).replace(new RegExp(`\\.${ext}$`, "i"), "");
  return `${sanitize(base)}.${ext}`;
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
  kind = "PDF",
  children,
}: {
  href: string;
  /** 저장될 파일 이름. 예: "임채헌 이력서.pdf" */
  filename?: string;
  className?: string;
  /** 화면낭독기용 형식 이름. pptx 등 PDF 가 아닌 첨부에 쓴다. */
  kind?: string;
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
      <span className="sr-only"> ({kind} 파일 저장)</span>
    </a>
  );
}
