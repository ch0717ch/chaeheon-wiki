import type { MetadataRoute } from "next";

// 검색 색인을 막는다. 링크를 직접 받은 사람만 보는 것을 전제로 한 사이트다.
// 크롤러 차단은 강제력이 없는 요청이므로, 공개하면 안 되는 자료는 애초에 올리지 않는다.
// 노출로 바꾸려면 여기와 app/layout.tsx 의 robots 를 함께 수정한다.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", disallow: "/" },
  };
}
