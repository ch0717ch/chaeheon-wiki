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

## 사용자 고정 규칙 (모든 세션에서 반드시 지킬 것)

- **사용자에게 "직접 복사해서 붙여넣어 달라"고 요청하는 것은 영구 금지.** 웹페이지·블로그 글·문서 내용이 필요하면
  Claude가 가진 도구(Claude in Chrome `mcp__claude-in-chrome__*`, 내장 브라우저, WebFetch, 검색 등)로 직접 읽는다.
  "붙여넣기가 가장 빠르다" 같은 제안도 하지 않는다.
- 참고 글을 읽어야 하는 작업은 Claude in Chrome을 먼저 쓴다 (도구가 지연 로딩이면 ToolSearch 로 `claude-in-chrome` 을 한 번에 불러온다).
  이 세션에 그 도구가 없거나 사이트가 막혀 있으면, 막힌 지점과 사용자가 켜야 할 것(크롬 확장 연결, 네트워크 허용 도메인)만 짧게 알리고
  읽기에 의존하지 않는 나머지 작업은 계속 진행한다.
- 사용자의 블로그스팟: 테크풀이 https://solving-it-tech.blogspot.com — 글 형식·검색 설명·라벨 작성법은 이 블로그의 실제 글
  (예: https://solving-it-tech.blogspot.com/2026/10/gta-6-5.html)을 읽고 따른다. 네이버식 post.html 형식으로 만들지 않는다.
