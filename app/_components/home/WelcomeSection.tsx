'use client';

import { useSession } from "next-auth/react";

const WelcomSection: React.FC = () => {
  const { data: userData } = useSession();
  const name: string = userData?.loginUser?.name ?? '';
  
  return (
    <div className="flex flex-col gap-2.5 text-left">
      <h2 className="text-h-1xl font-semibold text-title">{name}님,<br/>돌아오신 걸 환영해요!</h2>
      <p className="text-b-xl font-regular text-sub">오늘은 어떤 오브젝트를 배워볼까요?</p>
    </div>
  );
}

export default WelcomSection;