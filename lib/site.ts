// =====================================================================
// 사이트 소유자 정보. DB 가 아니라 코드에 둔다.
// 프로젝트·경력·연구는 계속 늘어나지만 이 값들은 거의 바뀌지 않기 때문이다.
// =====================================================================

export const site = {
  name: "임채헌",
  nameEn: "Chaeheon Lim",

  /** 한 줄 정체성. 브라우저 탭과 문서 머리에 함께 쓰인다. */
  title: "문헌정보학 · 업무 자동화 · AI 거버넌스 연구",

  /** 홈 첫 문단. 두세 문장 안에서 끝낸다. */
  intro:
    "반복되는 업무를 분석해 자동화하고, 그 과정에서 생기는 데이터와 자료를 다루는 도구를 직접 만듭니다. AI 에이전트를 실무 도구로 쓰면서 확인한 생산성과 위험을 국제경영·정보보안 관점에서 연구하고 있습니다.",

  /** 핵심 키워드. 6개 안팎이 적당하다. 그 이상은 초점이 흐려진다. */
  keywords: [
    "업무 자동화",
    "데이터 수집·정규화",
    "AI 에이전트 활용",
    "정보조직·정보검색",
    "AI 보안 거버넌스",
    "HRD 지식 아카이브",
  ],

  /** 외부 링크. 값이 비어 있으면 화면에서 자동으로 감춰진다. */
  links: {
    github: "https://github.com/ch0717ch",
    blog: "https://blog.naver.com/co0717gjs",
    blogPersonal: "https://blog.naver.com/eddiequate",
    instagram: "https://instagram.com/eddiequate",
    email: "co0717gjs@naver.com",
    linkedin: "",
  },

  /** 링크 설명. /contact 와 홈 참조 목록에서 함께 쓴다. */
  linkNotes: {
    github: "프로젝트 저장소",
    blog: "IT · 개발 기록",
    blogPersonal: "일상 · 대외활동",
    instagram: "@eddiequate",
    email: "가장 확실한 연락 경로",
  },

  /** 활동 지역. 프로필 상자에 표시된다. */
  location: "서울 · 경기, 대한민국",

  /** MBTI. 프로필 상자에 표시된다. */
  mbti: "ENTJ",

  /**
   * 생년월일. "1999년 7월 17일" 처럼 표기할 문자열을 그대로 넣는다.
   * 비워 두면 프로필 상자에서 이 줄이 통째로 빠진다.
   * ★ 값을 알려주지 않으셔서 비워 두었다. 여기만 채우면 바로 나온다.
   */
  birthDate: "",

  /**
   * 프로필 사진. 반명함(3:4) 비율로 잘라 public/images/profile.jpg 에 두면
   * 좌측 사이드바와 홈 프로필 상자에 함께 들어간다.
   * 비워 두면 자리표시자 상자가 대신 보인다.
   */
  photoUrl: "",

  /**
   * 학력 요약. 홈 프로필 상자에 한 줄씩 들어간다.
   * 자세한 내용은 Supabase 의 education 테이블이 담당하고,
   * 여기에는 프로필에 노출할 압축본만 둔다.
   */
  educationSummary: [
    "경기대학교 문헌정보학과 (3학년 재학)",
    "컴퓨터공학 학사 졸업",
    "영어통번역학 학사 졸업",
    "동안고등학교 졸업",
  ],

  /** 이력서 PDF. public/docs 에 파일을 두면 여기에 경로를 넣는다. */
  resumePdfUrl: "",
} as const;

/** 문서 트리. 좌측 내비와 사이트맵이 이 배열 하나를 공유한다. */
export const docTree = [
  { href: "/", label: "개요", note: "자기소개와 대표 작업" },
  { href: "/cv", label: "이력", note: "경력 · 학력 · 역량" },
  { href: "/work", label: "작업", note: "프로젝트 케이스 스터디" },
  { href: "/research", label: "연구", note: "관심사와 연구계획서" },
  { href: "/contact", label: "연락", note: "외부 링크와 연락처" },
] as const;
