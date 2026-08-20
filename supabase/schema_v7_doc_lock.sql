-- =====================================================================
-- V7: 문서 잠금 + 공개 생성
--
-- 실행: Supabase SQL Editor 에 붙여넣고 Run. 여러 번 실행해도 안전.
--
--   edit_password_hash : 문서 비밀번호(솔트+SHA256 해시). 생성자가 정한다.
--                        이 비밀번호로 자기 문서를 수정하고, 잠긴 경우 열람한다.
--   view_locked        : 켜면 비밀번호(또는 마스터 키) 없이는 문서를 볼 수 없다.
--
-- 해시 컬럼은 공개 API(anon)가 아예 읽을 수 없도록 컬럼 권한을 회수한다.
-- 이후 anon 의 people 조회는 select("*") 가 실패하므로, 코드는 항상
-- 컬럼을 명시해서 읽는다 (queries.ts 에 반영됨).
-- =====================================================================
alter table public.people add column if not exists edit_password_hash text not null default '';
alter table public.people add column if not exists view_locked boolean not null default false;

-- 보호 문서: 비밀번호가 없어도 마스터 인증키로만 수정할 수 있다.
-- (비밀번호도 없고 보호도 아니면 누구나 수정하는 열린 문서다)
alter table public.people add column if not exists is_protected boolean not null default false;

-- 임채헌 문서는 공개 열람 + 마스터 전용 수정으로 보호한다.
update public.people set is_protected = true where slug = 'chaeheon';

-- 해시 컬럼 차단. 컬럼 단위 revoke 는 테이블 전체 select 권한이 남아 있으면
-- 효력이 없으므로, 전체를 회수하고 허용 컬럼만 명시적으로 다시 부여한다.
-- ※ 이후 people 에 컬럼을 추가하면 여기의 grant 목록에도 추가해야
--    공개 화면에서 읽을 수 있다.
revoke select on public.people from anon, authenticated;
grant select (
  id, slug, name, name_en, title, intro,
  field_main, field_sub, keywords, mbti, birth_date,
  location, languages, photo_url, resume_pdf_url,
  music_url, music_title,
  link_github, link_blog, link_blog2, link_instagram,
  link_email, link_linkedin,
  education_summary, expertise,
  target_primary, target_secondary, target_edge,
  view_locked, is_protected, sort_order, is_published, created_at, updated_at
) on public.people to anon, authenticated;
