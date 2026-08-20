/**
 * 항목(프로젝트·경력·학력·연구계획)에 첨부하는 이미지.
 *
 * src 가 비어 있으면 아무것도 그리지 않아 기존 배치가 그대로 유지된다.
 * width 는 본문 폭 대비 % — 관리 폼에서 조절한다. 범위를 벗어나면 100 으로.
 */
export default function ContentImage({
  src,
  width,
  alt,
}: {
  src: string | null | undefined;
  width: number | null | undefined;
  alt: string;
}) {
  if (!src) return null;
  const w = width && width >= 10 && width <= 100 ? width : 100;

  return (
    <figure className="my-5 max-w-prose">
      {/* 외부 업로드 이미지라 원본 비율을 알 수 없어 next/image 대신 img 를 쓴다. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        style={{ width: `${w}%` }}
        className="h-auto max-w-full border border-rule"
      />
    </figure>
  );
}
