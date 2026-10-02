# CLAUDE.md

이 저장소에는 두 가지가 들어 있다.

1. 채헌위키 웹앱 (Next.js) — `app/`, `components/`, `lib/`, `supabase/`. 자세한 내용은 README.md.
2. 네이버 블로그 3개(1번 비즈니스·경제 / 2번 대학생활 / 3번 게임·IT)의 글 자동 작성 루틴 — `blog/`.

## 블로그 루틴

사용자가 **"오늘의 블로그 글 발행해줘"**, **"오늘의 키워드"** 등으로 요청하면
`.claude/skills/daily-blog/SKILL.md` 의 순서를 질문 없이 끝까지 실행한다.
블로그 3개 × 글 3개, 블로그별 압축파일 3개. 방향은 `blog/strategy/`, 설정은 `blog/blogs.json`, 예시는 `blog/posts/<biz|campus|tech>/2026-10-02/`.
