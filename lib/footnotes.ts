// =====================================================================
// 나무위키식 각주.
//
// 본문 어디에나 [*내용] 을 쓰면 그 자리에 [n] 위첨자가 붙고,
// 문서 하단 "각주" 절에 n. 내용 이 모인다. 번호는 문서 전체에서
// 나타나는 순서대로 이어진다.
//
// 페이지 하나가 렌더될 때 레지스트리를 하나 만들어 본문 컴포넌트에
// 넘기고, 마지막에 <FootnoteList> 가 그 레지스트리를 비운다.
// =====================================================================

export type Footnote = { n: number; text: string };

export class FootnoteRegistry {
  private notes: Footnote[] = [];
  private byText = new Map<string, number>();

  /**
   * 각주 하나를 등록하고 번호를 돌려준다.
   * 같은 내용이 페이지 안에서 다시 나오면(예: 프로필 상자와 본문에 같은 값이
   * 두 번 렌더될 때) 새 번호를 매기지 않고 처음 번호를 다시 쓴다.
   */
  add(text: string): number {
    const key = text.trim();
    const seen = this.byText.get(key);
    if (seen) return seen;
    const n = this.notes.length + 1;
    this.notes.push({ n, text: key });
    this.byText.set(key, n);
    return n;
  }

  private markedIds = new Set<number>();

  /** 본문에 id 앵커를 이미 붙였는지 — 되돌아갈 위치는 하나만 둔다. */
  marked(n: number): boolean {
    return this.markedIds.has(n);
  }
  mark(n: number): void {
    this.markedIds.add(n);
  }

  all(): Footnote[] {
    return this.notes;
  }

  get size(): number {
    return this.notes.length;
  }
}

/**
 * 각주 문법 두 종류. 대괄호 안에 ] 가 없다는 가정으로 단순하게 잡는다.
 *   [*내용]  → 번호 각주. [n] 이 붙고 문서 하단 목록에 모인다. 장문용.
 *   [**내용] → 툴팁 각주. * 표시만 붙고 마우스를 대면 말풍선으로 보인다. 단문용.
 * ** 를 먼저 시도해야 * 로 잘못 잡히지 않는다.
 */
export const FOOTNOTE_RE = /\[(\*\*?)([^\]]+)\]/g;

export type FootnotePart =
  | { kind: "text"; value: string }
  | { kind: "note"; value: string } // 번호 각주
  | { kind: "tip"; value: string }; // 툴팁 각주

/**
 * 텍스트를 일반 조각·번호각주·툴팁각주로 자른다.
 * 렌더 쪽에서 번호 각주를 만나면 registry.add 로 번호를 받는다.
 */
/** 문자열이 아닌 값이 흘러들어왔을 때 쓸 수 있는 만큼만 건진다. */
function asFallbackText(value: unknown): string {
  return typeof value === "number" || typeof value === "boolean" ? String(value) : "";
}

export function splitFootnotes(text: string): FootnotePart[] {
  // 본문은 결국 사람이 적은 값에서 온다. 타입상으로는 문자열이지만 JSON 칸을
  // 거쳐 숫자나 null 이 섞여 들어오면 matchAll 에서 터져 문서 전체가 500 이
  // 되므로, 마지막 길목인 여기서 한 번 더 막는다.
  const source = typeof text === "string" ? text : asFallbackText(text);
  const parts: FootnotePart[] = [];
  let last = 0;
  for (const m of source.matchAll(FOOTNOTE_RE)) {
    const idx = m.index ?? 0;
    if (idx > last) parts.push({ kind: "text", value: source.slice(last, idx) });
    parts.push({ kind: m[1] === "**" ? "tip" : "note", value: m[2] });
    last = idx + m[0].length;
  }
  if (last < source.length) parts.push({ kind: "text", value: source.slice(last) });
  return parts;
}

/** 각주 문법을 떼어낸 순수 텍스트. 메타 설명 등 각주가 들어가면 안 되는 곳에 쓴다. */
export function stripFootnotes(text: string): string {
  const source = typeof text === "string" ? text : asFallbackText(text);
  return source.replace(FOOTNOTE_RE, "").replace(/\s{2,}/g, " ").trim();
}
