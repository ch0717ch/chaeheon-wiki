import type { NextConfig } from "next";

// 기존에 공유된 주소가 깨지지 않도록 구 경로를 임채헌 문서로 넘긴다.
// V1 은 임채헌 단일 문서 구조였다 (/cv → /chaeheon/cv).
const LEGACY_PERSON = "chaeheon";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/cv", destination: `/${LEGACY_PERSON}/cv`, permanent: true },
      { source: "/work", destination: `/${LEGACY_PERSON}/work`, permanent: true },
      {
        source: "/work/:slug",
        destination: `/${LEGACY_PERSON}/work/:slug`,
        permanent: true,
      },
      { source: "/research", destination: `/${LEGACY_PERSON}/research`, permanent: true },
      { source: "/contact", destination: `/${LEGACY_PERSON}/contact`, permanent: true },
    ];
  },
};

export default nextConfig;
