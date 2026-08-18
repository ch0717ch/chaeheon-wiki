import Link from "next/link";

/**
 * 나무위키식 [수정] 링크. 공개 페이지 어디서나 상시 노출된다.
 *
 * 누르면 /admin 으로 이동하는데, 세션이 없으면 인증키 입력이 먼저 나오고
 * 통과하면 곧바로 해당 항목의 수정창이 열린다. 저장·취소하면 back 으로
 * 돌아온다. 인증키가 없는 방문자는 입력 화면에서 막힌다.
 */
export default function EditLink({
  table,
  id,
  person,
  back,
  label = "수정",
}: {
  table: string;
  /** 수정할 행 id. 생략하면 새 항목 작성이 열린다. */
  id?: string;
  /** 콘텐츠 테이블일 때 대상 인물 slug */
  person?: string;
  /** 저장·취소 후 돌아올 경로 */
  back: string;
  label?: string;
}) {
  const params = new URLSearchParams({ table, back });
  if (id) params.set("id", id);
  if (person) params.set("person", person);

  return (
    <Link
      href={`/admin?${params.toString()}`}
      className="no-print font-mono text-xs font-normal text-ink-muted underline-offset-2 hover:text-ink hover:underline"
    >
      [{label}]
    </Link>
  );
}
