'use client';

import TextInput from '@/app/_components/onboard/TextInput';
import { AI_ANSWER_EXAMPLE_LIST, LEVEL_LIST, PERSONA_LIST, SPECIALIZED_LIST, THEME_LIST } from '@/app/_constants/onboard';
import { useOnboard } from '@/app/_hooks/useOnboard';
import { SceneCategory } from '@/app/_types/home';
import { JSX, useState } from 'react';

interface StepConfig {
  title: JSX.Element;
  subTitle?: string;
  isNextDisabled: boolean;
}

export default function OnboardingPage() {
  const { step, formData, updateData, updateListData, nextStep, prevStep, isPending } = useOnboard(4);
  const [ aiAnswerIndex, setAiAnswerIndex ] = useState<number>(0); // AI 예시 응답용

  // --- 각 스텝별 설정 데이터 ---
  const stepConfigs: Record<number, StepConfig> = {
    1: {
      title: <>SIMVEX에 오신 것을 환영해요.<br />앞으로 제가 뭐라고 부르면 될까요?</>,
      subTitle: "이름은 언제든 바꿀 수 있어요!",
      isNextDisabled: formData.name.trim().length === 0,
    },
    2: {
      title: <>주로 학습할 분야와<br />본인의 학습 레벨에 대해 알려주세요!</>,
      subTitle: "학습 분야를 선택해도, 모든 분야의 오브젝트를 볼 수 있으니 걱정마세요!",
      isNextDisabled: !formData.preferCategory || !formData.educationLevel,
    },
    3: {
      title: <>혹시..<br />이미 잘 아는 분야가 있다면 알려주세요!</>,
      subTitle: "AI 튜터가 @@님에게 더 맞춤형으로 설명해줄 거예요",
      isNextDisabled: !formData.specialized.length,
    },
    4: {
      title: <>선호하는 색상 테마와<br />어시스턴트의 역할을 선택해 주세요!</>,
      isNextDisabled: !formData.themeColor || !formData.persona,
    }
  };
  const stepNumbers = Object.keys(stepConfigs).map(Number);

  const currentConfig = stepConfigs[step as keyof typeof stepConfigs];

  const handleSpecializedSelect = (selected: string, index: number) => {
      updateListData('specialized', selected);
      setAiAnswerIndex(index);
    };

  return (
    <main className="h-[calc(100vh-64px)] flex flex-row gap-42.5 px-38 py-20 bg-surface text-title">
      
      {/* 1. [좌측 사이드바] Stepper */}
      <aside className="flex flex-col items-center">
        {stepNumbers.map((num) => (
          <div key={num} className="flex flex-col items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-b-md font-medium transition-all duration-500
                ${step >= num ? 'bg-point-500 text-base-black border border-point-500' : 'bg-surface text-sub3 border border-bg-default'}`}>
              {num}
            </div>
            {num < 4 && (
              <div className={`w-0.5 h-14 transition-colors duration-500
                ${step > num ? 'bg-point-500' : 'bg-bg-default'}`} 
              />
            )}
          </div>
        ))}
      </aside>

      {/* 2. [우측 컨텐츠 & 공통 레이아웃] */}
      <section className="flex flex-col flex-1 relative min-w-120 max-w-200">
        {/* 공통 제목/소제목 영역 */}
        <header className="mb-20">
          <h1 className="text-h-1xl font-bold text-title mb-4.5">
            {currentConfig.title}
          </h1>
          { currentConfig.subTitle && <p className="text-b-xl text-sub">{currentConfig.subTitle}</p> }
        </header>

        {/* 3. [가변 컨텐츠 영역] Step별 폼 */}
        <article className="flex-1">
          {/* SIMVEX에 오신 것을 환영해요.
              앞으로 제가 뭐라고 부르면 될까요? */}
          {step === 1 && (
            <TextInput
              label="이름"
              value={formData.name}
              placeholder="이름을 입력해주세요"
              onChange={(val) => updateData('name', val)}
            />
          )}

          {/* 주로 학습할 분야와
              본인의 학습 레벨에 대해 알려주세요! */}
          {step === 2 && (
            <div className="flex flex-col">
              {/* 학습 분야 선택 */}
              <div className='flex flex-col gap-3.5'>
                <h3 className="text-b-md font-regular text-sub2">학습 분야</h3>
                <div className="flex flex-row gap-3.5">
                  {Object.keys(SceneCategory).map((selected) => (
                    <button
                      key={selected}
                      onClick={() => updateData('preferCategory', selected)}
                      className={`px-4 py-2.5 rounded-[10px] text-b-lg font-regular border
                        ${
                          formData.preferCategory === selected
                          ? 'bg-point-500 text-base-black border-point-500' 
                          : 'bg-bg-default text-sub2 border-border-default hover:border-border-hovered'
                        }`}
                    >
                      {selected}
                    </button>
                  ))}
                </div>
              </div>

              {/* 나의 학습 레벨 선택 */}
              <div className='flex flex-col gap-3.5 mt-9.5'>
                <h3 className="text-b-md font-regular text-sub2">나의 학습 레벨</h3>
                <div className="flex flex-col gap-3">
                  {LEVEL_LIST.map((level) => (
                    <button
                      key={level.id}
                      disabled={!formData.preferCategory}
                      onClick={() => updateData('educationLevel', level.id)}
                      className={`w-full p-5 rounded-xl text-left text-b-lg font-medium border
                        ${
                          formData.preferCategory
                          ? formData.educationLevel === level.id 
                            ? 'bg-selected border-point-500 text-base-black' 
                            : 'bg-bg-sub border-border-default text-sub2 hover:border-border-hovered'
                          : 'bg-bg-sub border-bg-sub text-placeholder cursor-not-allowed'
                        }`}
                    >
                      {level.desc}
                    </button>
                  ))}
                </div>
              </div>   
            </div>
          )}

          {/* 혹시..
              이미 잘 아는 분야가 있다면 알려주세요! */}
          {step === 3 && (
            <div className="">
              <h3 className="text-b-md font-regular text-sub2 mb-4">분야 (복수 선택 가능)</h3>
              <div className="grid grid-cols-3 gap-3">
                {SPECIALIZED_LIST.map((selected, index) => {
                  const isSelected = formData.specialized?.includes(selected);

                  return (
                    <button
                      key={selected}
                      onClick={()=>handleSpecializedSelect(selected, index)}
                      className={`
                        border rounded-xl py-3.25 text-b-lg font-medium
                        ${isSelected 
                          ? 'bg-point-500 border-border-focus text-base-black' 
                          : 'bg-bg-default border-border-default text-sub2 hover:border-border-hovered'}
                      `}
                    >
                      {selected}
                    </button>
                  );
                })}
              </div>
              <div className="bg-bg-sub px-5 py-4 rounded-[14px] border border-border-default mt-6.5">
                <p className="text-b-md font-regular text-sub">{AI_ANSWER_EXAMPLE_LIST[aiAnswerIndex]}</p>
              </div>
            </div>
          )}

          {/* 선호하는 색상 테마와
              어시스턴트의 역할을 선택해 주세요! */}
          {step === 4 && (
            <div className="flex flex-col">
              {/* 테마 섹션 */}
              <div>
                <h3 className="text-b-md font-regular text-sub2 mb-4">선호하는 색상 테마</h3>
                <div className="grid grid-cols-4 gap-3">
                  {THEME_LIST.map((t) => (
                    <button 
                      key={t.id}
                      onClick={() => updateData('themeColor', t.id)}
                      className={`bg-bg-default border rounded-xl px-5 py-4
                        ${formData.themeColor === t.id ? 'border-point-500' : 'border-border-default hover:border-border-hovered'}`}
                    >
                      <div className='flex justify-center items-center gap-3'>
                        <div 
                          className='w-4 h-4 rounded-full' 
                          style={{ backgroundColor: t.color }} 
                        />
                        <span className="text-b-md font-medium">{t.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 페르소나 섹션 */}
              <div className='mt-9.5'>
                <h3 className="text-b-md font-regular text-sub2 mb-4">내가 원하는 어시스턴트의 역할</h3>
                <div className="grid grid-cols-2 gap-4">
                  {PERSONA_LIST.map((p) => (
                    <button 
                    key={p.id} 
                    onClick={() => updateData('persona', p.id)}
                    className={`border rounded-xl px-6.25 py-5
                          ${formData.persona === p.id ? 'bg-bg-selected border-point-500' : 'bg-bg-default border-border-default hover:border-border-hovered'}`}
                    >
                      <div className='flex flex-col text-left'>
                        <p className={`text-b-lg font-semibold
                          ${formData.persona === p.id ? 'text-base-black' : 'text-sub2'}`}>{p.role}</p>
                        <p className={`text-b-md font-regular text-base-black
                          ${formData.persona === p.id ? 'text-base-black' : 'text-sub'}`}>{p.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </article>

        {/* 4. [하단 공통 버튼바] */}
        <footer className="w-full flex gap-4 mt-9.25">
          {step > 1 && (
            <button 
              onClick={prevStep} 
              disabled={isPending}
              className="py-4 px-8.5 rounded-[14px] text-b-xl text-sub bg-bg-default disabled:opacity-50"
            >
              이전
            </button>
          )}
          <button
            onClick={nextStep}
            disabled={currentConfig.isNextDisabled || isPending}
            className={`w-53.5 py-4 rounded-[14px] text-b-xl font-medium
              ${currentConfig.isNextDisabled || isPending 
                ? 'bg-bg-sub text-placeholder cursor-not-allowed' 
                : 'bg-point-500 text-base-black'
              }`}
          >
          다음으로
          </button>
        </footer>
      </section>
    </main>
  );
}