'use client';

import { useState } from 'react';
import { $fetch } from '../_utils/fetch';
import { useRouter } from 'next/navigation';
import { SceneCategory } from '../_types/home';
import { useSession } from 'next-auth/react';

const initialData: OnboardData = {
  name: '',
  preferCategory: '',
  educationLevel: undefined,
  specialized: [],
  persona: undefined,
  themeColor: undefined
};

export const useOnboard = (totalSteps: number) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<OnboardData>(initialData);
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();
  const { data: session, update } = useSession();

  // 특정 키의 값 업데이트
  const updateData = (key: keyof OnboardData, value: OnboardData[keyof OnboardData]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  // string[] 방식 키의 값 업데이트
  const updateListData = (key: keyof OnboardData, value: string) => {
    setFormData((prev) => {
      // 해당 키의 기존 값을 배열로 가져옴 (없으면 빈 배열)
      const currentList = Array.isArray(prev[key]) ? (prev[key] as string[]) : [];

      // "없음" 선택 시 로직
      if (value === "없음") {
        return { ...prev, [key]: ["없음"] };
      }

      // "없음"이 아닌 다른 것을 선택하면 "없음"은 제거
      const filteredList = currentList.filter((item) => item !== "없음");

      const newList = filteredList.includes(value)
        ? filteredList.filter((item) => item !== value)
        : [...filteredList, value];

      return { ...prev, [key]: newList };
    });
  };

  // 2. 다음 단계 (마지막이면 제출 로직)
  const nextStep = async () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      setIsPending(true); // 로딩 시작
      
      try {
        const reqData: OnboardRequestData = {
          ...formData,
          preferCategory: SceneCategory[formData.preferCategory as keyof typeof SceneCategory],
          specialized: formData.specialized.join(',')
        };

        await update({
          ...session,
          loginUser: {
            ...session?.loginUser,
            name: formData.name,
            themeColor: formData.themeColor,
            preferCategory: formData.preferCategory,
          },
        });

        await $fetch('/onboard', { 
          method: 'PATCH', 
          body: JSON.stringify(reqData) 
        });

        router.push('/onboard-finished');
      } catch (error) {
        console.error("온보딩 실패:", error);
        alert("저장에 실패했습니다. 다시 시도해주세요.");
      } finally {
        setIsPending(false); // 로딩 종료
      }
    }
  };

  // 3. 이전 단계
  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  return {
    step,
    formData,
    updateData,
    updateListData,
    nextStep,
    prevStep,
    isPending,
    isFirst: step === 1,
    isLast: step === totalSteps,
  };
};