-- =====================================================================
-- V6: 항목별 이미지 첨부 (프로젝트 · 경력 · 학력 · 연구계획)
--
-- 실행: Supabase SQL Editor 에 붙여넣고 Run. 여러 번 실행해도 안전.
-- image_url 을 비우면 기존과 동일하게 표시된다.
-- image_width 는 본문 폭 대비 % (10~100). 비우면 100.
-- =====================================================================
alter table public.projects       add column if not exists image_url   text not null default '';
alter table public.projects       add column if not exists image_width integer;
alter table public.experiences    add column if not exists image_url   text not null default '';
alter table public.experiences    add column if not exists image_width integer;
alter table public.education      add column if not exists image_url   text not null default '';
alter table public.education      add column if not exists image_width integer;
alter table public.research_plans add column if not exists image_url   text not null default '';
alter table public.research_plans add column if not exists image_width integer;
