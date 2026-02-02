import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // R3F 공식 문서 권장: three를 transpilePackages에 추가
  transpilePackages: ['three'],
  
  // Turbopack 설정 (Next.js 16 기본)
  // 빈 객체로 설정하면 webpack 설정과 충돌 없이 Turbopack 사용
  turbopack: {},
  
  // Webpack 설정 (--webpack 플래그 사용 시 또는 Turbopack이 지원하지 않는 경우)
  webpack: (config, { isServer }) => {
    // 클라이언트 측 번들에서 Node.js의 fs 모듈을 제외
    // fs 모듈을 필요로 하는 라이브러리가 브라우저 환경에서 오류를 일으키는 것을 방지
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
