/**
 * 단색 아이콘. 흑백 디자인이라 색 없이 형태만으로 구분되도록 그렸다.
 * 외부 아이콘 라이브러리를 넣지 않는다 — 필요한 것이 4종뿐이다.
 */

type IconProps = { className?: string };

const base = "inline-block shrink-0";

export function GithubIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
      className={`${base} ${className}`}
    >
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  );
}

/** 네이버 블로그 — 네이버 심볼을 단색 도형으로 단순화했다. */
export function BlogIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
      className={`${base} ${className}`}
    >
      <path d="M1.5 1.5h13v13h-13v-13Zm2 2v9h2.6V7.9l3.3 4.6H13v-9h-2.6v4.6L7.1 3.5H3.5Z" />
    </svg>
  );
}

/**
 * Blogspot(구글) 블로그 — 네이버 N 과 나란히 놓이므로 G 로 구분한다.
 * 원 안의 G. 획 두께를 N 사각형과 비슷하게 맞춰 나란히 놔도 무게가 같다.
 */
export function BlogspotIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
      className={`${base} ${className}`}
    >
      <circle cx="8" cy="8" r="6.3" />
      <path
        d="M10.9 5.6a3.6 3.6 0 1 0 .55 3.15H8.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function InstagramIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      aria-hidden="true"
      className={`${base} ${className}`}
    >
      <rect x="1.7" y="1.7" width="12.6" height="12.6" rx="4" />
      <circle cx="8" cy="8" r="3.1" />
      <circle cx="11.9" cy="4.1" r="0.85" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function MailIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`${base} ${className}`}
    >
      <rect x="1.3" y="3.2" width="13.4" height="9.6" />
      <path d="m1.3 3.9 6.7 4.6 6.7-4.6" />
    </svg>
  );
}
