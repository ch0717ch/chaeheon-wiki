// 프로필 상자 추가 항목(people.profile_extra) 읽기.
//
// 한 줄이 "이름: 내용" 하나다. 같은 이름이 여러 줄이면 한 행에 모은다.
//   가족: 아버지 ○○○
//   가족: 어머니 ○○○   →  가족 | 아버지 ○○○ / 어머니 ○○○
// 첫 콜론에서만 자르므로 내용에 주소(https://…)가 들어가도 된다.

export type ExtraRow = { label: string; items: string[] };

/** 첫 콜론(반각·전각)에서 자른다. 이름이나 내용이 비면 null. */
export function splitExtraLine(line: string): { label: string; value: string } | null {
  const m = /^([^:：]+)[:：](.*)$/.exec(line);
  if (!m) return null;
  const label = m[1].trim();
  const value = m[2].trim();
  return label && value ? { label, value } : null;
}

/** 표시 순서는 이름이 처음 나온 순서를 따른다. 형식이 어긋난 줄은 건너뛴다. */
export function parseProfileExtra(lines: string[]): ExtraRow[] {
  const rows: ExtraRow[] = [];
  for (const line of lines) {
    const part = splitExtraLine(line);
    if (!part) continue;
    const row = rows.find((r) => r.label === part.label);
    if (row) row.items.push(part.value);
    else rows.push({ label: part.label, items: [part.value] });
  }
  return rows;
}
