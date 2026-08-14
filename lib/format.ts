// 날짜 표기는 "2026.03" 처럼 연·월까지만 쓴다. 이력에서 일자는 정보가 아니라 소음이다.

export function formatMonth(date: string | null): string {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * 기간 표기.
 *   진행 중            -> "2024.03 – 현재"
 *   종료 + 종료일 있음 -> "2022.01 – 2024.02"
 *   종료 + 종료일 없음 -> "2024.01"  (한 시점으로만 적는다)
 *
 * 마지막 경우를 "– 현재"로 적으면 끝난 일이 진행 중으로 보인다.
 * 시작일이 없으면 빈 문자열을 돌려주고 화면에서 아예 감춘다.
 */
export function formatPeriod(
  start: string | null,
  end: string | null,
  isCurrent = false,
): string {
  const from = formatMonth(start);
  if (!from) return isCurrent ? "진행 중" : "";
  if (isCurrent) return `${from} – 현재`;
  const to = formatMonth(end);
  return to ? `${from} – ${to}` : from;
}

/** 빈 문자열·null 을 걸러낸 배열. 렌더 직전에 한 번 통과시킨다. */
export function compact(values: (string | null | undefined)[]): string[] {
  return values.filter((v): v is string => Boolean(v && v.trim()));
}

/**
 * 본문 텍스트를 빈 줄 기준으로 문단 배열로 쪼갠다.
 * DB 에 여러 문단을 넣어도 화면에서 한 덩어리로 뭉치지 않게 한다.
 */
export function toParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/** 링크 라벨용. https:// 와 끝 슬래시를 떼어 도메인+경로만 남긴다. */
export function prettyUrl(url: string): string {
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
}
