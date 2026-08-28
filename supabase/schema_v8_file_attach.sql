-- ============================================================
-- v8 — 작업물 원본 파일 첨부
--
-- PDF 말고 실제 결과물 파일(pptx·docx·xlsx)을 그대로 내려받게 한다.
-- 경력(experiences)과 프로젝트(projects) 두 곳에 한 칸씩 붙인다.
--
-- file_url   : Storage 공개 URL
-- file_label : 화면에 보일 이름. 비우면 '작업물 원본 파일'로 표시된다.
--
-- experiences / projects 는 테이블 단위 select 정책을 쓰므로
-- 컬럼을 더해도 별도 권한 작업이 필요 없다.
-- ============================================================

alter table public.experiences
  add column if not exists file_url   text not null default '',
  add column if not exists file_label text not null default '';

alter table public.projects
  add column if not exists file_url   text not null default '',
  add column if not exists file_label text not null default '';

-- PDF 절의 이름. 비우면 '원본 포트폴리오'.
-- 첨부가 원본 작업물이 아니라 가이드·안내서일 때 바꿔 쓴다.
alter table public.projects
  add column if not exists label_pdf text not null default '';
