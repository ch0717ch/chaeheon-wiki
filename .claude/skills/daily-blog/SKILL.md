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

**thumb.json** — 썸네일. 레퍼런스(쓰리휴먼스 블로그) 스타일 = **잡지 표지형**. 반드시 이 형식으로 만든다.
구성: 빨간 붓터치 배너 → 흰/노랑/하늘 외곽선 초대형 제목 3줄 → 오른쪽 주제 소품 → 노란 포스트잇 손글씨 체크리스트 → 하단 4칸 타일(검정/빨강 캡션)
```json
{
  "theme": "scholarship | volunteer | activity",
  "banner": "국가장학금 **바뀐다?!**",          // 12자 안팎, 끝은 ?! 로. **강조** = 노란 글씨
  "title": ["학자금 구간", "10→5개", "대개편?"], // 1줄 흰(6자), 2줄 노랑(핵심 숫자·단어, 5자), 3줄 하늘(질문, 6자)
  "note": ["구간 변환표", "금액 변화", "1차 신청 일정", "신청 전 체크"], // 본문 소제목 순서대로 4개, 7자 안팎
  "hero": { "type": "phone", "paper": "", "header": "", "sub": "", "rows": [["왼쪽", "칩"]] },
  "tiles": [{ "icon": "table", "top": "내 구간", "bottom": "어디로?" }]  // 정확히 4개, 각 줄 6자 안팎
}
```
- hero 종류: `phone`(앱 화면 목록 rows 최대 5개) / `passport`(label, from, to, ticketNote, seat, stamp) / `certificate`(paper, title, no 또는 noText(발급번호 대신 쓸 문구), rows[[항목,값]] 4개, stamp). 주제에 맞는 게 없으면 가장 가까운 것을 고르고 글자를 주제에 맞게 바꾼다.
- tile icon: `table coin calendar check globe warning doc phone stamp question`
- 사용자가 배경 사진(AI 생성 이미지 등)을 주면 글 폴더에 넣고 `"bg": "bg.jpg"` 를 추가 → 그려진 책상 대신 그 사진 위에 같은 구성을 얹는다.
- 썸네일의 모든 문구는 본문에 실제로 있는 내용이어야 한다(낚시 금지). 개인정보처럼 보이는 실제 이름·번호는 넣지 말고 OO 처리.

## 3단계 — 빌드

```bash
node blog/tools/build-post.mjs blog/posts/<날짜>      # post.html + 발행메모.txt 생성
node blog/tools/render-thumbs.mjs blog/posts/<날짜>   # thumb.png 생성 (첫 실행 시 폰트 자동 다운로드)
```

생성된 `thumb.png` 3장을 Read 로 직접 열어 확인한다: 제목·배너가 잘리지 않았는지, 포스트잇 4줄이 타일에 가려지지 않았는지, 소품 글자가 서로 겹치지 않았는지. 문제가 있으면 글자 수를 줄여 다시 렌더링한다.

## 4단계 — 검수 (adsense-blog-writing 28번 체크리스트)

- 제목 3안이 본문과 일치하는지, 같은 키워드를 억지로 반복하지 않았는지
- "오늘은 ~에 대해 알아보겠습니다", "결론적으로", "~하는 것이 중요합니다" 같은 AI 상투구 제거
- 숫자·날짜마다 meta.json `sources` 에 근거가 있는지

## 5단계 — 전달

1. 현재 브랜치에 커밋하고 `git push -u origin <브랜치>`
2. `SendUserFile` 로 세 글의 `thumb.png` 3장(render), `발행메모.txt` 3개(attach), `post.html` 3개(attach)를 보낸다.
3. 채팅에는 짧게: 오늘 고른 키워드 3개와 고른 이유 한 줄씩, 발행 전 사용자가 직접 확인해야 할 것(checklist 중 사실 재확인 항목).
