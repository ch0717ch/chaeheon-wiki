# CLAUDE.md

이 저장소에는 두 가지가 들어 있다.

1. 채헌위키 웹앱 (Next.js) — `app/`, `components/`, `lib/`, `supabase/`. 자세한 내용은 README.md.
2. 네이버 블로그 3개(1번 비즈니스·경제 / 2번 대학생활 / 3번 게임·IT)의 글 자동 작성 루틴 — `blog/`.

## 블로그 루틴

사용자가 **"오늘의 블로그 글 발행해줘"**, **"오늘의 키워드"** 등으로 요청하면
`.claude/skills/daily-blog/SKILL.md` 의 순서를 질문 없이 끝까지 실행한다.
블로그 3개 × 글 3개, 블로그별 압축파일 3개. 방향은 `blog/strategy/`, 설정은 `blog/blogs.json`, 예시는 `blog/posts/<biz|campus|tech>/2026-10-02/`.

## 테크풀이 (Blogspot)

사용자가 **"테크풀이 오늘의 키워드"** 처럼 테크풀이(구글 블로그스팟)를 지정하면 daily-blog 스킬의 같은 순서로,
`blog/posts/techpuli/<날짜>/` 에 **글 2개**(개수를 따로 말하면 그 수)를 만든다. 방향은 `blog/strategy/techpuli.md`
(구글 제목 규칙, meta.json `description` 필수, 태그는 Blogger 라벨). 네이버 3번 블로그와 같은 주제를 그대로 옮기지 않는다.
