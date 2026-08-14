// 날짜 표기는 "2026.03" 처럼 연·월까지만 쓴다. 이력에서 일자는 정보가 아니라 소음이다.

export function formatMonth(date: string | null): string {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * 기간을 "2024.03 – 현재" 또는 "2022.01 – 2024.02" 로 만든다.
 * 시작일이 없으면 빈 문자열을 돌려주고, 화면에서는 아예 감춘다.
 */
export function formatPeriod(
  start: string | null,
  end: string | null,
  isCurrent = false,
): string {
  const from = formatMonth(start);
  if (!from) return isCurrent ? "진행 중" : "";
  const to = isCurrent || !end ? "현재" : formatMonth(end);
  return `${from} – ${to}`;
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
