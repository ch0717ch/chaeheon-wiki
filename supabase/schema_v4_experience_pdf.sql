-- =====================================================================
-- V4: 경력 항목에 포트폴리오 PDF 첨부
--
-- 실행: Supabase SQL Editor 에 붙여넣고 Run. 여러 번 실행해도 안전.
-- 관리 화면 경력 폼의 "포트폴리오 PDF URL" 이 이 컬럼이다.
-- =====================================================================
alter table public.experiences add column if not exists pdf_url text not null default '';
