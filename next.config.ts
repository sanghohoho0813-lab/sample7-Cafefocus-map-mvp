import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      // 카페 목록은 지도 화면의 목록 패널·시트로 통합했다. 기존 링크는 지도로 보낸다.
      { source: "/cafes", destination: "/", permanent: false },
    ];
  },
};

export default nextConfig;
