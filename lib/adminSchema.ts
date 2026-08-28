// =====================================================================
// 관리 화면과 쓰기 API 가 공유하는 필드 명세.
//
// 서버는 이 명세에 있는 테이블·컬럼만 받아들인다(화이트리스트).
// 화면은 이 명세로 폼을 그린다. 한 곳만 고치면 양쪽이 함께 바뀐다.
// =====================================================================

export type FieldType =
  | "text" // 한 줄 텍스트
  | "textarea" // 여러 문단 (빈 줄로 문단 구분)
  | "lines" // 배열 — 한 줄이 항목 하나
  | "date" // YYYY-MM-DD
  | "bool"
  | "int"
  | "select"
  | "json"; // jsonb — JSON 텍스트로 편집

export type FieldSpec = {
  key: string;
  label: string;
  type: FieldType;
  options?: readonly string[]; // select 용
  hint?: string;
};

export type TableSpec = {
  table: string;
  label: string;
  /** 목록에서 행 제목으로 쓸 컬럼 */
  titleKey: string;
  fields: FieldSpec[];
};

/** 본문형 필드에 공통으로 붙는 안내. 각주 문법을 알려준다. */
const FN_HINT =
  "각주 [*장문] → 번호[1] + 하단 목록 · 툴팁 [**단문] → * 표시, 마우스 올리면 말풍선";

/** 항목 이미지 두 칸. image_url 은 _url 로 끝나 업로드 버튼이 자동으로 붙는다. */
const IMAGE_FIELDS: FieldSpec[] = [
  {
    key: "image_url",
    label: "이미지 URL",
    type: "text",
    hint: "글 상단에 표시. 비우면 이미지 없음 — 업로드 버튼으로 올린다",
  },
  {
    key: "image_width",
    label: "이미지 폭 %",
    type: "int",
    hint: "10~100. 비우면 100(본문 폭 가득)",
  },
];

/**
 * 원본 작업물 첨부 한 칸. PDF 말고 실제 결과물 파일(pptx·docx·xlsx)을 그대로 올린다.
 * _url 로 끝나 업로드 버튼이 자동으로 붙는다.
 */
const FILE_FIELDS: FieldSpec[] = [
  {
    key: "file_url",
    label: "작업물 파일 URL",
    type: "text",
    hint: "PPTX·DOCX·XLSX 등 실제 결과물. 업로드 버튼으로 올리면 채워진다",
  },
  {
    key: "file_label",
    label: "작업물 파일 이름",
    type: "text",
    hint: "화면에 보일 이름. 비우면 '작업물 원본 파일'",
  },
];

const COMMON_TAIL: FieldSpec[] = [
  { key: "sort_order", label: "정렬 순서", type: "int", hint: "작을수록 위" },
  { key: "is_published", label: "공개", type: "bool", hint: "끄면 사이트에서 숨김(초안)" },
];

export const PROFILE_SPEC: TableSpec = {
  table: "people",
  label: "인물 문서",
  titleKey: "name",
  fields: [
    {
      key: "slug",
      label: "URL 조각",
      type: "text",
      hint: "슬래시 없이 영문 소문자로. 예: eunsj 라고 적으면 주소가 사이트/eunsj 가 된다",
    },
    { key: "name", label: "이름", type: "text" },
    { key: "name_en", label: "영문 이름", type: "text" },
    { key: "title", label: "한 줄 정체성", type: "text" },
    { key: "intro", label: "개요 소개문", type: "textarea", hint: FN_HINT },
    { key: "field_main", label: "주 분야", type: "text" },
    { key: "field_sub", label: "부 분야", type: "text" },
    { key: "keywords", label: "핵심 키워드", type: "lines" },
    { key: "mbti", label: "MBTI", type: "text" },
    { key: "birth_date", label: "생년월일(표기)", type: "text", hint: "예: 1999년 7월 17일. 비우면 숨김" },
    { key: "location", label: "지역", type: "text" },
    { key: "languages", label: "언어", type: "text" },
    { key: "photo_url", label: "사진 URL", type: "text", hint: "아래 업로드 버튼으로 채울 수 있음" },
    { key: "resume_pdf_url", label: "이력서 PDF URL", type: "text" },
    {
      key: "music_url",
      label: "배경음악 URL",
      type: "text",
      hint: "mp3 / wav 를 업로드 버튼으로 올린다. 비우면 재생 버튼이 숨겨진다",
    },
    { key: "music_title", label: "곡 제목", type: "text", hint: "재생 버튼 옆에 표시" },
    { key: "link_github", label: "GitHub", type: "text" },
    { key: "link_blog", label: "블로그", type: "text" },
    { key: "link_blog2", label: "블로그 2", type: "text" },
    { key: "link_instagram", label: "Instagram", type: "text" },
    { key: "link_email", label: "이메일", type: "text" },
    { key: "link_linkedin", label: "LinkedIn", type: "text" },
    {
      key: "links_extra",
      label: "추가 링크(JSON)",
      type: "json",
      hint: '위 칸으로 모자랄 때. [{"label":"블로그 3","url":"https://...","note":"설명"}, ...]',
    },
    { key: "education_summary", label: "학력 요약(프로필 상자)", type: "lines" },
    {
      key: "expertise",
      label: "전문 분야(JSON)",
      type: "json",
      hint: '[{"title":"영역","summary":"한 줄","skills":["항목",...]}, ...]',
    },
    { key: "target_primary", label: "지향 직무: 우선", type: "text" },
    { key: "target_secondary", label: "지향 직무: 확장", type: "text" },
    { key: "target_edge", label: "차별점", type: "text" },
    {
      key: "view_locked",
      label: "문서 잠금(열람 제한)",
      type: "bool",
      hint: "켜고 저장해야 열람이 막힌다. 비밀번호만 설정하면 수정만 막히고 열람은 공개 — 열람까지 막으려면 반드시 이 스위치를 켠다",
    },
    {
      key: "new_password",
      label: "문서 비밀번호 변경",
      type: "text",
      hint: "새 비밀번호(4자 이상). 비워 두면 기존 유지. 비밀번호가 없는 문서는 누구나 수정 가능",
    },
    {
      key: "is_protected",
      label: "보호 문서",
      type: "bool",
      hint: "보호 문서는 일반 편집으로 바꿀 수 없다",
    },
    ...COMMON_TAIL,
  ],
};

export const CONTENT_SPECS: TableSpec[] = [
  {
    table: "projects",
    label: "프로젝트",
    titleKey: "title",
    fields: [
      { key: "slug", label: "URL 조각", type: "text", hint: "슬래시 없이 영문 소문자·하이픈. 예: my-project" },
      { key: "title", label: "제목", type: "text" },
      { key: "summary", label: "한 줄 요약", type: "textarea" },
      { key: "category", label: "분류", type: "text", hint: "예: 웹 서비스 / 데이터 / 창작" },
      ...IMAGE_FIELDS,
      { key: "label_problem", label: "1절 이름", type: "text", hint: "비우면 '문제'. 공연이면 '기획 배경' 처럼 바꿀 수 있다" },
      { key: "problem", label: "1절 본문 (기본: 문제)", type: "textarea", hint: FN_HINT },
      { key: "label_role", label: "2절 이름", type: "text", hint: "비우면 '역할'" },
      { key: "role", label: "2절 본문 (기본: 역할)", type: "textarea", hint: FN_HINT },
      { key: "label_decisions", label: "3절 이름", type: "text", hint: "비우면 '핵심 판단'" },
      { key: "key_decisions", label: "3절 목록 (기본: 핵심 판단)", type: "lines", hint: FN_HINT },
      { key: "label_outcome", label: "4절 이름", type: "text", hint: "비우면 '결과'" },
      { key: "outcome", label: "4절 본문 (기본: 결과)", type: "textarea", hint: FN_HINT },
      { key: "tech_stack", label: "기술 스택", type: "lines" },
      { key: "period_start", label: "시작", type: "date" },
      { key: "period_end", label: "종료", type: "date" },
      { key: "is_ongoing", label: "진행 중", type: "bool" },
      { key: "github_url", label: "GitHub URL", type: "text" },
      { key: "blog_url", label: "블로그 URL", type: "text" },
      { key: "demo_url", label: "데모 URL", type: "text" },
      { key: "pdf_url", label: "PDF URL", type: "text" },
      {
        key: "label_pdf",
        label: "PDF 절 이름",
        type: "text",
        hint: "비우면 '원본 포트폴리오'. 안내서를 붙일 때는 '이용 가이드' 처럼 바꾼다",
      },
      ...FILE_FIELDS,
      { key: "is_featured", label: "대표 작업", type: "bool", hint: "개요의 대표 3개 후보" },
      ...COMMON_TAIL,
    ],
  },
  {
    table: "experiences",
    label: "경력",
    titleKey: "org",
    fields: [
      { key: "org", label: "조직", type: "text" },
      { key: "title", label: "직함/역할", type: "text" },
      { key: "employment_type", label: "고용 형태", type: "text" },
      { key: "location", label: "지역", type: "text" },
      { key: "period_start", label: "시작", type: "date" },
      { key: "period_end", label: "종료", type: "date" },
      { key: "is_current", label: "재직 중", type: "bool" },
      { key: "description", label: "설명", type: "textarea", hint: FN_HINT },
      { key: "highlights", label: "주요 성과(불릿)", type: "lines", hint: FN_HINT },
      {
        key: "pdf_url",
        label: "포트폴리오 PDF URL",
        type: "text",
        hint: "인턴 일지 등 증빙 문서. 업로드 버튼으로 올리면 채워진다",
      },
      ...FILE_FIELDS,
      ...IMAGE_FIELDS,
      ...COMMON_TAIL,
    ],
  },
  {
    table: "education",
    label: "학력",
    titleKey: "school",
    fields: [
      { key: "school", label: "학교", type: "text", hint: "비우면 전공이 제목 자리를 대신" },
      { key: "degree", label: "학위", type: "text" },
      { key: "field", label: "전공", type: "text" },
      { key: "location", label: "지역", type: "text" },
      { key: "period_start", label: "시작", type: "date" },
      { key: "period_end", label: "종료", type: "date" },
      { key: "is_current", label: "재학 중", type: "bool" },
      { key: "note", label: "비고", type: "textarea" },
      ...IMAGE_FIELDS,
      ...COMMON_TAIL,
    ],
  },
  {
    table: "certifications",
    label: "자격·면허",
    titleKey: "name",
    fields: [
      { key: "name", label: "명칭", type: "text" },
      { key: "issuer", label: "발급 기관", type: "text" },
      {
        key: "kind",
        label: "구분",
        type: "select",
        options: ["certificate", "license", "course", "award"] as const,
        hint: "certificate=자격증 license=면허 course=수료 award=수상",
      },
      { key: "issued_on", label: "취득일", type: "date" },
      { key: "note", label: "비고", type: "text" },
      ...COMMON_TAIL,
    ],
  },
  {
    table: "timeline",
    label: "연혁",
    titleKey: "title",
    fields: [
      { key: "year", label: "연도", type: "int" },
      { key: "month", label: "월", type: "int", hint: "모르면 비움" },
      { key: "end_year", label: "종료 연도", type: "int", hint: "기간 활동일 때만" },
      { key: "title", label: "제목", type: "text" },
      { key: "category", label: "분류", type: "text", hint: "활동/교육/경력/학력/자격/프로젝트/창작" },
      { key: "note", label: "비고", type: "text" },
      ...COMMON_TAIL,
    ],
  },
  {
    table: "research_plans",
    label: "연구계획",
    titleKey: "title",
    fields: [
      { key: "slug", label: "URL 조각", type: "text", hint: "슬래시 없이 영문 소문자·하이픈. 예: my-project" },
      { key: "title", label: "제목", type: "text" },
      { key: "abstract", label: "요약", type: "textarea", hint: FN_HINT },
      { key: "interests", label: "관심 키워드", type: "lines" },
      { key: "research_questions", label: "연구 질문", type: "lines", hint: FN_HINT },
      { key: "methodology", label: "연구 방법", type: "textarea", hint: FN_HINT },
      {
        key: "status",
        label: "상태",
        type: "select",
        options: ["draft", "in_progress", "submitted", "published"] as const,
        hint: "draft=초안 in_progress=진행 submitted=제출 published=게재",
      },
      { key: "pdf_url", label: "PDF URL", type: "text" },
      ...IMAGE_FIELDS,
      { key: "reference_urls", label: "참고 링크", type: "lines" },
      ...COMMON_TAIL,
    ],
  },
];

export const ALL_SPECS: TableSpec[] = [PROFILE_SPEC, ...CONTENT_SPECS];

export function findSpec(table: string): TableSpec | undefined {
  return ALL_SPECS.find((s) => s.table === table);
}
