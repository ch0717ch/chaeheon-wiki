-- =====================================================================
-- V3: 문서별 배경음악
--
-- 실행: Supabase SQL Editor 에 붙여넣고 Run. 여러 번 실행해도 안전.
-- 컬럼 2개만 추가한다. 관리 화면의 "배경음악 URL" / "곡 제목" 이 이 컬럼이다.
-- =====================================================================
alter table public.people add column if not exists music_url   text not null default '';
alter table public.people add column if not exists music_title text not null default '';
