---
name: daily-blog
description: 사용자의 네이버 블로그 3개(1번 비즈니스·경제·사회 / 2번 대학생활 장학금·봉사·대외활동 / 3번 게임·AI/IT·기술)에 각각 오늘자 글 3개씩, 총 9개를 키워드 조사부터 HTML·썸네일·발행메모·블로그별 압축파일까지 한 번에 만드는 루틴. 사용자가 "오늘의 키워드", "오늘의 블로그 글 발행해줘", "블로그 글 뽑아줘", "/daily-blog" 라고 하면 반드시 이 스킬을 따른다.
---

# 오늘의 블로그 글 발행 루틴 (블로그 3개 × 글 3개)

사용자가 이 루틴을 부르면 **질문하지 말고 끝까지 진행**한다.

| 블로그 | 키 | 주제 | 결과 폴더 | 방향 문서 |
|---|---|---|---|---|
| 1번 | `biz` | 비즈니스·경제·사회 (시사 + 꾸준한 유입) | `blog/posts/biz/<날짜>/` | `blog/strategy/biz.md` |
| 2번 | `campus` | 대학생활: 장학금·봉사·대외활동 | `blog/posts/campus/<날짜>/` | `blog/strategy/campus.md` |
| 3번 | `tech` | 게임·AI/IT·기술 | `blog/posts/tech/<날짜>/` | `blog/strategy/tech.md` |

블로그 이름·압축파일 이름·테마 목록은 `blog/blogs.json`. 세 방향 문서를 먼저 읽는다 (campus.md 2~3번은 공통 원칙).
**블로그마다 글 3개 → 압축파일 3개**가 기본 결과물이다. 세 블로그를 순서대로(1번 → 2번 → 3번) 처리한다.
글쓰기 규칙은 `anthropic-skills:adsense-blog-writing` 스킬을 함께 적용한다(사람 우선, AI 냄새 제거, 허위 금지).

## 1단계 — 실시간 키워드 뽑기 (WebSearch, mode=extended)

1. 이미 쓴 글과 겹치지 않게 `blog/posts/<키>/*/*/meta.json` 의 `keyword` 목록을 블로그별로 먼저 본다.
2. 오늘 날짜 기준으로 블로그별 검색을 한 번에 여러 개 보낸다:
   - **1번 biz**: 한국은행·기재부·금융위 발표, 이번 주 경제 일정(금통위·물가·고용 지표), 부동산·대출·세금 정책, 사회 제도 변화
   - **2번 campus**: 한국장학재단·교육부 장학 공지, 대학생 봉사·해외봉사 모집, 대외활동·공모전 모집/마감, 그 달 대학 시즌 이슈
   - **3번 tech**: 게임 신작 출시·연기·업데이트, e스포츠·게임쇼 일정, AI 모델·서비스·규제 뉴스, 스마트폰·PC 신제품 가격, OS 지원 종료·보안 이슈
3. 블로그마다 방향 문서의 '하루 3개 구성'에 맞춰 3개를 고른다.
   - 날짜·금액·인원 같은 사실을 **검색 결과로 확인할 수 있는 주제만** 고른다.
   - `blog.naver.com` 은 컨테이너에서 막혀 있으니 시도하지 말 것.

## 2단계 — 글 폴더 만들기

각 글마다 `blog/posts/<키>/<날짜>/<번호>-<짧은-한글-슬러그>/` 에 아래 3개 파일을 쓴다.
형식은 `blog/posts/biz/2026-10-02/`, `blog/posts/campus/2026-10-02/`, `blog/posts/tech/2026-10-02/` 의 글을 그대로 따라 한다.

번호는 블로그·날짜 폴더마다 01부터. 같은 날 두 번째 실행이면 마지막 번호 다음부터 이어 붙인다(04, 05, 06…).

**source.md** — 본문. 문법은 `blog/tools/build-post.mjs` 상단 주석 참고.
- `[사진]` 줄은 쓰지 않는다 (사용자가 HTML을 통째로 복붙하므로 자리 표시가 남으면 안 됨).
- 도입 2~3문단(독자 상황 → 답의 방향), 질문형/결론형 `##` 소제목 4~6개
- 비교가 실제로 쉬워질 때만 표, 체크리스트, 자주 나오는 질문 2~3개, 마지막에 `:::summary 정리하면` (HTML에서는 표로 바뀐다 — 네이버에서 div 박스는 깨지므로 박스·정리는 항상 `:::box`/`:::summary` 문법으로만 쓰고 HTML을 직접 꾸미지 말 것)
- 마지막 줄 `※ <날짜> 기준 …` 출처·기준일
- 공백 제외 1,700~2,500자. 글자 수 채우기용 문단 금지.
- 확인 못 한 정보는 "확인되지 않았다/공지 전"이라고 쓴다. 경험담 지어내기 금지.

**meta.json** — 키: `no, theme(blogs.json 의 그 블로그 themes 중 하나), category(blogs.json 의 그 블로그 categories 중 하나 — 1번: 비즈니스|경제|사회, 2번: 장학금|봉사활동|대외활동, 3번: 게임|AI|IT), keyword, subKeywords[], intent, angle, titles[3](검색형·궁금증형·인간형 순), pick("A|B|C — 이유"), tags[10](# 없이), check[1~2](발행 전 체크, 한 줄 20자 안팎: 사실 재확인·캡처 추가 정도만), sources[]`

**thumb.json** — 썸네일. 레퍼런스(쓰리휴먼스 블로그) 스타일 = **잡지 표지형**. 반드시 이 형식으로 만든다.
구성: 빨간 붓터치 배너 → 흰/노랑/하늘 외곽선 초대형 제목 3줄 → 오른쪽 주제 소품 → 노란 포스트잇 손글씨 체크리스트 → 하단 4칸 타일(검정/빨강 캡션)
```json
{
  "theme": "블로그별 테마 (biz: finance|economy|society / campus: scholarship|volunteer|activity / tech: game|ai|it)",
  "banner": "국가장학금 **바뀐다?!**",          // 12자 안팎, 끝은 ?! 로. **강조** = 노란 글씨
  "title": ["학자금 구간", "10→5개", "대개편?"], // 1줄 흰(6자), 2줄 노랑(핵심 숫자·단어, 5자), 3줄 하늘(질문, 6자)
  "note": ["구간 변환표", "금액 변화", "1차 신청 일정", "신청 전 체크"], // 본문 소제목 순서대로 4개, 7자 안팎
  "hero": { "type": "phone", "paper": "", "header": "", "sub": "", "rows": [["왼쪽", "칩"]] },
  "tiles": [{ "icon": "table", "top": "내 구간", "bottom": "어디로?" }]  // 정확히 4개, 각 줄 6자 안팎
}
```
- hero 종류 (자세한 키는 `blog/tools/render-thumbs.mjs` 의 각 hero 함수 위 주석):
  - `phone`(paper, header, sub, rows[[왼쪽, 칩]] 최대 5개) — 목록·가격표·일정표
  - `passport`(label, from, to, ticketNote, seat, stamp) — 여행·행사 티켓 (from/to 는 3~5자 영문)
  - `certificate`(paper, title, no 또는 noText, rows[[항목,값]] 4개, stamp) — 서류·명세서·정책 요약
  - `chart`(paper, label, value, change, up, points[], rows 최대 3개) — 금리·지표·한도
  - `laptop`(header, lines[] 최대 4개, 줄당 18자 안팎, badge) — AI 채팅·설정·업데이트 화면
  - `console`(sub, title, date, badge) — 게임 타이틀·출시일
- tile icon: `table coin calendar check globe warning doc phone stamp question chart won house people chip gamepad trophy shield`
- 사용자가 배경 사진(AI 생성 이미지 등)을 주면 글 폴더에 넣고 `"bg": "bg.jpg"` 를 추가 → 그려진 책상 대신 그 사진 위에 같은 구성을 얹는다.
- 썸네일의 모든 문구는 본문에 실제로 있는 내용이어야 한다(낚시 금지). 개인정보처럼 보이는 실제 이름·번호는 넣지 말고 OO 처리.

## 3단계 — 빌드

블로그마다 (키 = biz, campus, tech):
```bash
node blog/tools/build-post.mjs blog/posts/<키>/<날짜> [--only 04,05,06]   # post.html + 발행메모_<날짜>.txt
node blog/tools/render-thumbs.mjs blog/posts/<키>/<날짜>                  # thumb.png (첫 실행 시 폰트 자동 다운로드)
python3 blog/tools/pack.py blog/posts/<키>/<날짜> [--only 04,05,06] --out <스크래치패드>   # <label>_<날짜>.zip
```
`--only` 에는 이번에 만든 글 번호만 넣는다(그날 첫 실행이면 생략).

결과물 형식 (사용자 요청으로 고정):
- HTML: 1·3번 블로그는 파일 이름에 세부주제가 들어간다 → `[경제] 01-글폴더.html`, 2번은 `post.html`. 안내문·`[사진]` 자리 표시 없음. 열어서 Ctrl+A → Ctrl+C 하면 본문만 복사된다.
- `발행메모_<날짜>.txt`: 글 폴더 밖에 **하나만**. 글별로 카테고리 + 제목 3안(★추천 표시) + 태그 + 짧은 발행 전 체크만. 본문 텍스트·키워드 분석·출처는 넣지 않는다.
- 압축파일: `발행메모_<날짜>.txt` + 글 폴더마다 `post.html`, `thumb.png` 만. **사용법 파일은 만들지 않는다.**

생성된 `thumb.png` 9장을 Read 로 직접 열어 확인한다: 제목·배너가 잘리지 않았는지, 포스트잇 4줄이 타일에 가려지지 않았는지, 소품 글자가 서로 겹치지 않았는지. 문제가 있으면 글자 수를 줄여 다시 렌더링한다.

## 4단계 — 검수 (adsense-blog-writing 28번 체크리스트)

- 제목 3안이 본문과 일치하는지, 같은 키워드를 억지로 반복하지 않았는지
- "오늘은 ~에 대해 알아보겠습니다", "결론적으로", "~하는 것이 중요합니다" 같은 AI 상투구 제거
- 숫자·날짜마다 meta.json `sources` 에 근거가 있는지

## 5단계 — 전달

1. 현재 브랜치에 커밋하고 `git push -u origin <브랜치>`
2. `SendUserFile` 로 블로그별 압축파일 3개(attach: 1번, 2번, 3번 순서)를 보내고, 썸네일 9장은 한 번에 render 로 보낸다. 사용자는 폰에서 받아 컴퓨터로 옮겨 작업하므로 압축파일이 기본 전달물이다.
3. 채팅에는 블로그별로 짧게: 고른 키워드 3개와 이유 한 줄씩, 발행 전 사용자가 직접 확인해야 할 것(check 항목).
