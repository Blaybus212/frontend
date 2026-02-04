'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError(`아이디 또는 비밀번호를 확인해주세요.\n ${result?.error}`);
      setIsLoading(false);
    } else {
      router.push('/home');
      router.refresh();
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#12141c] p-6 font-sans">
      <div className="flex w-full max-w-[1000px] overflow-hidden rounded-3xl bg-[#1c1f2a] shadow-2xl">
        
        {/* 왼쪽: 그라데이션 아트 카드 */}
        <div className="relative hidden w-1/2 flex-col justify-between p-12 lg:flex">
          <div className="z-10 flex items-center gap-2 text-white">
            <div className="h-6 w-6 rounded-md border-2 border-[#d4ff59]" />
            <span className="text-xl font-bold tracking-tight">SIMVEX</span>
          </div>
          
          {/* 중앙 그라데이션 구체/박스 효과 */}
          <div className="absolute inset-0 m-auto h-[350px] w-[350px] rounded-[60px] bg-gradient-to-br from-[#d4ff59] via-[#86b11b] to-[#1c1f2a] opacity-80 blur-2xl" />
          <div className="relative z-10 aspect-square w-full rounded-[40px] border border-white/10 bg-gradient-to-br from-white/10 to-transparent backdrop-blur-md shadow-inner" />
          
          <div className="z-10 text-white/40 text-sm">© 2026 SIMVEX All rights reserved.</div>
        </div>

        {/* 오른쪽: 로그인 폼 섹션 */}
        <div className="w-full p-12 lg:w-1/2 lg:p-16">
          <div className="mb-12">
            <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-xl bg-[#d4ff59]/10 border border-[#d4ff59]/20">
              <div className="h-5 w-5 rounded border-2 border-[#d4ff59]" />
            </div>
            <h2 className="text-3xl font-bold leading-tight text-white">
              서비스 슬로건 <br />
              <span className="text-white/90">두 줄 정도 넣겠습니다</span>
            </h2>
            <p className="mt-2 text-gray-500 text-sm italic">서비스 부제</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6 text-sm">
            <div className="space-y-2">
              <label className="text-gray-400 ml-1 font-medium">아이디</label>
              <input
                type="email"
                placeholder="아이디를 입력하세요"
                className="w-full rounded-xl bg-[#252a37] p-4 text-white placeholder-gray-600 outline-none transition focus:ring-2 focus:ring-[#d4ff59]/50"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-gray-400 ml-1 font-medium">비밀번호</label>
              <input
                type="password"
                placeholder="비밀번호를 입력하세요"
                className="w-full rounded-xl bg-[#252a37] p-4 text-white placeholder-gray-600 outline-none transition focus:ring-2 focus:ring-[#d4ff59]/50"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && <p className="text-xs text-red-400 ml-1 italic">{error}</p>}

            <button
              type="submit"
              disabled={isLoading}
              className="mt-4 w-full rounded-xl bg-[#d4ff59] p-4 font-bold text-black transition hover:bg-[#c2eb4c] active:scale-[0.98] disabled:opacity-50"
            >
              {isLoading ? '연결 중...' : '로그인'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}