-- ============================================================
-- v9 — 자유 링크 목록
--
-- link_blog2, link_blog3 … 처럼 채널이 늘 때마다 컬럼을 붙이는 대신
-- 목록 하나로 받는다. 형태:
--   [{"label":"블로그 3","url":"https://...","note":"설명"}, ...]
--
-- ★ people 은 컬럼 단위로 select 권한을 준다(v7). 새 컬럼은 반드시
--   grant 를 따로 해 줘야 익명 사용자가 읽을 수 있다.
--   (edit_password_hash 가 새어 나가지 않게 테이블 단위 select 를 회수한 구조다)
-- ============================================================

alter table public.people
  add column if not exists links_extra jsonb not null default '[]'::jsonb;

grant select (links_extra) on public.people to anon, authenticated;
