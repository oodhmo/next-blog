import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    // 실제로는 S3 presigned URL만 사용하므로 임의의 외부 호스트를 이미지 최적화
    // 엔드포인트의 오픈 프록시로 쓸 수 없도록 AWS S3 호스트로만 한정한다.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.amazonaws.com",
      },
    ],
  },
};

export default nextConfig;
