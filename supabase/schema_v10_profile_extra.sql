-- ============================================================
-- v10 — 프로필 상자 추가 항목
--
-- 프로필 상자의 고정 칸(이름·생년월일·MBTI …) 밖에 문서마다 원하는 행을
-- 더한다. 비워 두면 아무것도 표시되지 않으므로, 필요한 문서에서만 쓴다.
-- 관리 화면에서 한 줄에 하나씩 "이름: 내용" 으로 적는다.
--   가족: 아버지 ○○○
--   가족: 어머니 ○○○
--   취미: 등산
-- 같은 이름을 여러 줄 쓰면 한 행에 목록으로 모인다.
--
-- 실행: Supabase SQL Editor 에 붙여넣고 Run. 여러 번 실행해도 안전.
--
-- ★ people 은 컬럼 단위로 select 권한을 준다(v7). 새 컬럼은 반드시
--   grant 를 따로 해 줘야 익명 사용자가 읽을 수 있다.
-- ============================================================

alter table public.people
  add column if not exists profile_extra text[] not null default '{}';

grant select (profile_extra) on public.people to anon, authenticated;
