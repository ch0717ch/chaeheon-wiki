# blog/ — 네이버 블로그 하루 3글 루틴

채팅에 **"오늘의 블로그 글 발행해줘"** 라고 보내면 Claude가 `.claude/skills/daily-blog/SKILL.md` 순서대로
키워드 조사 → 글 3개 → 썸네일 3장을 만들어 `posts/<날짜>/` 에 넣는다.

```
posts/2026-10-02/
  01-국가장학금-5구간-개편/
    발행메모.txt   ← 제목 3안·태그·텍스트 본문·사진 위치·발행 체크 (복붙용)
    post.html      ← 브라우저로 열어 흰 영역 복사 → 스마트에디터에 붙여넣기 (서식 유지)
    thumb.png      ← 1080x1080 대표 이미지
    source.md / meta.json / thumb.json  ← 위 3개를 만드는 원본
```

수동 빌드: `node blog/tools/build-post.mjs blog/posts/<날짜>` / `node blog/tools/render-thumbs.mjs blog/posts/<날짜>`
