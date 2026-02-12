'use client';

import { useEffect, useState } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';


export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
      if (status === 'authenticated' && session) {
          router.push('/onboard');
      }
    }, [session, status, router]);

  const handleLogin = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const result = await signIn('credentials', {
      username,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError('아이디 또는 비밀번호를 확인해주세요.');
      console.error(result?.error);
      setIsLoading(false);
    } else {
      router.refresh();
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)] items-center justify-center bg-surface px-40 py-12">
      {/* 왼쪽: 그라데이션 아트 카드 */}
      <div className="relative hidden lg:flex shrink-0 aspect-[550/735.94] h-full overflow-hidden"> 
        <Image
          src="/images/login-graphic-bg.svg" 
          alt="그래픽 배경"  
          fill
          priority
          className="object-cover"
        />

        <div className="absolute top-12 right-29 w-[86.7%] aspect-square animate-float">
          <Image
            src="/images/login-graphic-icon.png"
            alt="그래픽 아이콘"
            fill
            priority
            className="object-contain"
          />
        </div>
        <div className='absolute bottom-10 left-9 flex flex-col text-left'>
          <h1 className='font-rem text-[50px] text-[#0B2314]'>SIMVEX</h1>
          <p className='text-placeholder text-[18px]/[24px] font-medium'>공학 학습과 연구를 하나로 잇는<br/>3D 시각화·시뮬레이션 플랫폼</p>
        </div>
      </div>

      {/* 오른쪽: 로그인 폼 섹션 */}
      <div className="w-full pl-24">
        <div className="mb-12">
          <Image
            src="/images/logo.svg" 
            alt="로고"
            priority
            width={44}
            height={44}
            className='mb-5.5'
          />
          <h2 className="text-h-1xl font-bold  text-title">
            나에게 쉽게 보이는,<br />
            3D 학습 플랫폼 SIMVEX
          </h2>
          <p className="mt-2 text-sub text-h-sm font-regular">안그래도 어려운데 더 어려우면 안되니까!</p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-7">
          <div className="flex flex-col gap-[7.5px]">
            <label className="text-b-md font-regular text-sub2">아이디</label>
            <input
              type="text"
              placeholder="아이디를 입력하세요"
              className="w-full rounded-xl bg-bg-default px-4 py-3.25 text-base-white placeholder-sub outline-none transition focus:ring-2 focus:ring-border-focus"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-[7.5px]">
            <label className="text-b-md font-regular text-sub2">비밀번호</label>
            <input
              type="password"
              placeholder="비밀번호를 입력하세요"
              className="w-full rounded-xl bg-bg-default px-4 py-3.25 text-base-white placeholder-sub outline-none transition focus:ring-2 focus:ring-border-focus"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="text-xs text-red-400 ml-1">{error}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-[14px] bg-point-500 p-4 text-b-xl font-medium text-base-black transition active:scale-[0.98] disabled:opacity-50"
          >
            {isLoading ? '로그인 중...' : '로그인'}
          </button>
        </form>
      </div>
    </div>
  );
}