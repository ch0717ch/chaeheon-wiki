-- =====================================================================
-- V5: 프로젝트 케이스 스터디의 섹션 이름을 문서별로 바꿀 수 있게
--
-- 실행: Supabase SQL Editor 에 붙여넣고 Run. 여러 번 실행해도 안전.
-- 비워 두면 기본 이름(문제 / 역할 / 핵심 판단 / 결과)이 쓰인다.
-- =====================================================================
alter table public.projects add column if not exists label_problem   text not null default '';
alter table public.projects add column if not exists label_role      text not null default '';
alter table public.projects add column if not exists label_decisions text not null default '';
alter table public.projects add column if not exists label_outcome   text not null default '';
