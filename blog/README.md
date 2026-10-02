# blog/ — 네이버 블로그 3개 × 하루 3글 루틴

채팅에 **"오늘의 키워드"** 또는 **"오늘의 블로그 글 발행해줘"** 라고 보내면 Claude가 `.claude/skills/daily-blog/SKILL.md` 순서대로
블로그마다 키워드 조사 → 글 3개 → 썸네일 → 압축파일까지 만든다 (압축파일 3개).

| 블로그 | 키 | 주제 |
|---|---|---|
| 1번 | biz | 비즈니스·경제·사회 |
| 2번 | campus | 대학생활: 장학금·봉사·대외활동 |
| 3번 | tech | 게임·AI/IT·기술 |

```
posts/<키>/2026-10-02/
  발행메모_2026-10-02.txt     ← 글별 제목 3안(★추천)·태그·짧은 발행 전 체크
  01-국가장학금-5구간-개편/
    post.html                 ← 열어서 Ctrl+A → Ctrl+C → 네이버 스마트에디터에 붙여넣기
    thumb.png                 ← 1080x1080 대표 이미지
    source.md / meta.json / thumb.json  ← 위 파일을 만드는 원본
```

수동 빌드
```
node blog/tools/build-post.mjs blog/posts/<키>/<날짜> [--only 04,05,06]
node blog/tools/render-thumbs.mjs blog/posts/<키>/<날짜>
python3 blog/tools/pack.py blog/posts/<키>/<날짜> [--only 04,05,06] [--out 폴더]
```
