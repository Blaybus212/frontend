/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next.js 13.1 이상: three를 transpilePackages에 추가
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

module.exports = nextConfig;

