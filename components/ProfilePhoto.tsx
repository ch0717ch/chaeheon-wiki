import { site } from "@/lib/site";

/**
 * 반명함(3:4) 비율의 프로필 사진.
 *
 * site.photoUrl 이 비어 있으면 같은 크기의 자리표시자를 그린다.
 *
 * 폭은 항상 부모를 채운다(w-full). 크기를 정하고 싶으면 호출하는 쪽에서
 * 감싸는 요소에 폭을 준다 — 여기에 w-32 같은 값을 함께 넘기면
 * w-full 과 중복돼 어느 쪽이 이길지 불확실해진다.
 */
export default function ProfilePhoto({ className = "" }: { className?: string }) {
  if (site.photoUrl) {
    return (
      // 원본 비율을 모르므로 next/image 대신 object-cover 로 3:4 를 강제한다.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={site.photoUrl}
        alt={`${site.name} 프로필 사진`}
        className={`aspect-[3/4] w-full border border-rule object-cover ${className}`}
      />
    );
  }

  return (
    <div
      role="img"
      aria-label="프로필 사진 자리 (준비 중)"
      className={`flex aspect-[3/4] w-full flex-col items-center justify-center border border-dashed border-line-soft bg-paper-deep text-center ${className}`}
    >
      <span aria-hidden className="text-lg leading-none text-ink-muted">
        ▣
      </span>
      <span className="mt-1 px-2 text-[0.625rem] leading-tight text-ink-muted">
        사진
        <br />
        준비 중
      </span>
    </div>
  );
}
