---
name: daily-blog
description: 네이버 블로그 '대학생활 정보노트 : 장학금·봉사·대외활동(에디)'의 오늘자 글 3개를 키워드 조사부터 발행메모·HTML·썸네일까지 한 번에 만드는 루틴. 사용자가 "오늘의 블로그 글 발행해줘", "오늘의 키워드", "블로그 글 뽑아줘", "/daily-blog" 라고 하면 반드시 이 스킬을 따른다.
---

# 오늘의 블로그 글 발행 루틴

사용자가 이 루틴을 부르면 **질문하지 말고 끝까지 진행**한다. 결과는 `blog/posts/<오늘 날짜 YYYY-MM-DD>/` 에 쌓는다.
먼저 `blog/STRATEGY.md` 를 읽어 방향(진단·레퍼런스 패턴·하지 않을 것·하루 3개 구성 원칙)을 확인한다.
글쓰기 규칙은 `anthropic-skills:adsense-blog-writing` 스킬을 함께 적용한다(사람 우선, AI 냄새 제거, 허위 금지).

## 1단계 — 실시간 키워드 뽑기 (WebSearch, mode=extended)

1. 이미 쓴 글과 겹치지 않게 `blog/posts/*/*/meta.json` 의 `keyword` 목록을 먼저 본다.
2. 오늘 날짜 기준으로 동시에 검색한다:
   - 한국장학재단·교육부 장학 공지 (신청 기간, 제도 개편)
   - 대학생 봉사활동 / 해외봉사 모집 (링커리어, 대학 사회봉사센터, 한국대학사회봉사협의회)
   - 대학생 대외활동·서포터즈·공모전 모집/마감 (링커리어, 콘테스트코리아, 씽굿)
   - 시즌 이슈 (수강신청, 등록금, 졸업인증, 방학 일정 등 그 달에 몰리는 검색)
3. 후보 중 STRATEGY.md 5번 원칙(시즌 1 + 비교·판단 1 + 방법·해결 1)에 맞춰 3개를 고른다.
   - 날짜·금액·인원 같은 사실을 **검색 결과로 확인할 수 있는 주제만** 고른다.
   - `blog.naver.com` 은 컨테이너에서 막혀 있으니 시도하지 말 것.

## 2단계 — 글 폴더 만들기

각 글마다 `blog/posts/<날짜>/<번호>-<짧은-한글-슬러그>/` 에 아래 3개 파일을 쓴다.
형식은 `blog/posts/2026-10-02/` 의 세 글을 그대로 따라 한다(가장 좋은 예시).

**source.md** — 본문. 문법은 `blog/tools/build-post.mjs` 상단 주석 참고.
- 첫 줄 `[사진] thumb.png — 대표 이미지로 지정`
- 도입 2~3문단(독자 상황 → 답의 방향), 질문형/결론형 `##` 소제목 4~6개
- 비교가 실제로 쉬워질 때만 표, 체크리스트, 자주 나오는 질문 2~3개, `:::summary 정리하면` 박스
- 마지막 줄 `※ <날짜> 기준 …` 출처·기준일
- 공백 제외 1,700~2,500자. 글자 수 채우기용 문단 금지.
- 확인 못 한 정보는 "확인되지 않았다/공지 전"이라고 쓴다. 경험담 지어내기 금지.

**meta.json** — 키: `no, theme(scholarship|volunteer|activity), category, keyword, subKeywords[], intent, angle, titles[3](검색형·궁금증형·인간형 순), pick, tags[10](# 없이), photos[], checklist[], sources[]`

**thumb.json** — 키: `theme, badge(10자 내외), category(선택), lines[3](헤드라인, **강조** 1군데), sub, points[3](본문에 실제 있는 내용만), footRight`
- 헤드라인 한 줄 9자 안팎. 길면 `headlineSize`(기본 118)를 100 정도로 줄인다.
- 썸네일 문구가 본문 내용과 반드시 일치해야 한다(낚시 금지).

## 3단계 — 빌드

```bash
node blog/tools/build-post.mjs blog/posts/<날짜>      # post.html + 발행메모.txt 생성
node blog/tools/render-thumbs.mjs blog/posts/<날짜>   # thumb.png 생성 (첫 실행 시 폰트 자동 다운로드)
```

생성된 `thumb.png` 3장을 Read 로 직접 열어 글자 넘침·겹침이 없는지 확인하고, 있으면 thumb.json 을 고쳐 다시 렌더링한다.

## 4단계 — 검수 (adsense-blog-writing 28번 체크리스트)

- 제목 3안이 본문과 일치하는지, 같은 키워드를 억지로 반복하지 않았는지
- "오늘은 ~에 대해 알아보겠습니다", "결론적으로", "~하는 것이 중요합니다" 같은 AI 상투구 제거
- 숫자·날짜마다 meta.json `sources` 에 근거가 있는지

## 5단계 — 전달

1. 현재 브랜치에 커밋하고 `git push -u origin <브랜치>`
2. `SendUserFile` 로 세 글의 `thumb.png` 3장(render), `발행메모.txt` 3개(attach), `post.html` 3개(attach)를 보낸다.
3. 채팅에는 짧게: 오늘 고른 키워드 3개와 고른 이유 한 줄씩, 발행 전 사용자가 직접 확인해야 할 것(checklist 중 사실 재확인 항목).
