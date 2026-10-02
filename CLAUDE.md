# CLAUDE.md

이 저장소에는 두 가지가 들어 있다.

1. 채헌위키 웹앱 (Next.js) — `app/`, `components/`, `lib/`, `supabase/`. 자세한 내용은 README.md.
2. 네이버 블로그 글 자동 작성 루틴 — `blog/`.

## 블로그 루틴

사용자가 **"오늘의 블로그 글 발행해줘"**, **"오늘의 키워드"** 등으로 요청하면
`.claude/skills/daily-blog/SKILL.md` 의 순서를 질문 없이 끝까지 실행한다.
방향은 `blog/STRATEGY.md`, 예시는 `blog/posts/2026-10-02/`.
