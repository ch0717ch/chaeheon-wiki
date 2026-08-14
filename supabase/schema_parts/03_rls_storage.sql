-- =====================================================================
-- schema — RLS 정책 · Storage 버킷
--
-- 01 -> 02 -> 03 순서로 실행한다. 여러 번 실행해도 안전하다.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 5. RLS — 공개 읽기 전용
--
--    select 정책 하나씩만 만든다. insert / update / delete 정책이 없으면
--    RLS 가 켜진 테이블에서는 해당 동작이 전부 거부된다.
--    is_published = false 인 행은 공개 사이트에서 아예 조회되지 않으므로
--    초안을 안전하게 보관할 수 있다.
-- ---------------------------------------------------------------------
alter table public.projects       enable row level security;
alter table public.experiences    enable row level security;
alter table public.education      enable row level security;
alter table public.research_plans enable row level security;
alter table public.certifications enable row level security;
alter table public.timeline       enable row level security;

drop policy if exists "projects public read" on public.projects;
create policy "projects public read"
  on public.projects for select
  to anon, authenticated
  using (is_published);

drop policy if exists "experiences public read" on public.experiences;
create policy "experiences public read"
  on public.experiences for select
  to anon, authenticated
  using (is_published);

drop policy if exists "education public read" on public.education;
create policy "education public read"
  on public.education for select
  to anon, authenticated
  using (is_published);

drop policy if exists "research_plans public read" on public.research_plans;
create policy "research_plans public read"
  on public.research_plans for select
  to anon, authenticated
  using (is_published);

drop policy if exists "certifications public read" on public.certifications;
create policy "certifications public read"
  on public.certifications for select
  to anon, authenticated
  using (is_published);

drop policy if exists "timeline public read" on public.timeline;
create policy "timeline public read"
  on public.timeline for select
  to anon, authenticated
  using (is_published);


-- ---------------------------------------------------------------------
-- 6. (선택) PDF 저장용 Storage 버킷
--
--    이력서 / 연구계획서 PDF 를 Supabase Storage 에 두고 싶을 때만 실행한다.
--    공개 버킷이므로 URL 을 아는 사람은 누구나 받을 수 있다. 그래서
--    개인정보가 들어간 파일은 여기 올리지 않는다.
--    올린 뒤 얻는 공개 URL 을 projects.pdf_url / research_plans.pdf_url 에 넣는다.
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('documents', 'documents', true)
on conflict (id) do nothing;

drop policy if exists "documents public read" on storage.objects;
create policy "documents public read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'documents');
