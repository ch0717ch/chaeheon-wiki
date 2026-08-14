// =====================================================================
// 사이트 소유자 정보. DB 가 아니라 코드에 둔다.
// 프로젝트·경력·연구는 계속 늘어나지만 이 값들은 거의 바뀌지 않기 때문이다.
//
// ★ 배포 전에 이 파일의 값을 본인 정보로 바꾼다.
// =====================================================================

export const site = {
  name: "홍길동",
  nameEn: "Hong Gildong",

  /** 한 줄 정체성. 브라우저 탭과 문서 머리에 함께 쓰인다. */
  title: "HRD 기획자 · 조직학습 연구",

  /** 홈 첫 문단. 두세 문장 안에서 끝낸다. */
  intro:
    "교육 프로그램을 기획하고, 그 과정에서 생기는 데이터와 자료를 다루는 도구를 직접 만듭니다. 조직에 쌓인 경험이 사람이 바뀌어도 남게 하는 방법에 관심이 있습니다.",

  /** 핵심 키워드. 6개 안팎이 적당하다. 그 이상은 초점이 흐려진다. */
  keywords: [
    "HRD 기획",
    "조직학습",
    "지식 아카이브",
    "교육 성과 측정",
    "Next.js",
    "Supabase",
  ],

  /** 외부 링크. 값이 비어 있으면 화면에서 자동으로 감춰진다. */
  links: {
    github: "https://github.com/GITHUB_USERNAME",
    blog: "https://BLOG_URL",
    email: "co0717gjs@naver.com",
    linkedin: "",
  },

  /** 활동 지역. 인포박스에 표시된다. */
  location: "서울, 대한민국",

  /** 이력서 PDF. public/ 에 파일을 두거나 Supabase Storage 공개 URL 을 넣는다. */
  resumePdfUrl: "",
} as const;

/** 문서 트리. 좌측 내비와 사이트맵이 이 배열 하나를 공유한다. */
export const docTree = [
  { href: "/", label: "개요", note: "자기소개와 대표 작업" },
  { href: "/cv", label: "이력", note: "경력 · 학력 · 역량" },
  { href: "/work", label: "작업", note: "프로젝트 목록" },
  { href: "/research", label: "연구", note: "관심사와 연구계획서" },
  { href: "/contact", label: "연락", note: "외부 링크와 연락처" },
] as const;
