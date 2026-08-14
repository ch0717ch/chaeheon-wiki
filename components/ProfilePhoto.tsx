import { site } from "@/lib/site";

/**
 * 반명함(3:4) 비율의 프로필 사진 자리.
 *
 * site.photoUrl 이 비어 있으면 같은 크기의 자리표시자를 그린다.
 * 사진이 준비되면 public/images/profile.jpg 로 넣고
 * lib/site.ts 의 photoUrl 에 "/images/profile.jpg" 만 적으면 교체된다.
 * 레이아웃이 이미 확정돼 있어 그때 화면이 흔들리지 않는다.
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
