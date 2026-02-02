import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // R3F 공식 문서 권장: three를 transpilePackages에 추가
  transpilePackages: ['three'],
  
  webpack: (config, { isServer }) => {
    // three.js 관련 모듈을 클라이언트에서만 로드
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    return config;
  },
};

export default nextConfig;
