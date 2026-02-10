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
  const [ aiAnswerIndex, setAiAnswerIndex ] = useState<number>(0);

  const stepConfigs: Record<number, StepConfig> = {
    1: {
      title: <>SIMVEX에 오신 것을 환영해요.<br />앞으로 제가 뭐라고 부르면 될까요? </>,
      subTitle: "이름은 언제든 바꿀 수 있어요!",
      isNextDisabled: formData.name.trim().length === 0,
    },
    2: {
      title: <>주로 학습할 분야와<br />본인의 학습 레벨에 대해 알려주세요! </>,
      subTitle: "학습 분야를 선택해도, 모든 분야의 오브젝트를 볼 수 있으니 걱정마세요!",
      isNextDisabled: !formData.preferCategory || !formData.educationLevel,
    },
    3: {
      title: <>혹시..<br />이미 잘 아는 분야가 있다면 알려주세요! </>,
      subTitle: `AI 튜터가 ${formData.name}님에게 더 맞춤형으로 설명해줄 거예요`,
      isNextDisabled: !formData.specialized.length,
    },
    4: {
      title: <>선호하는 색상 테마와<br />어시스턴트의 역할을 선택해 주세요! </>,
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
    <main className="h-[calc(100vh-64px)] flex flex-row gap-42.5 px-38 py-10 bg-surface text-title overflow-hidden">
      
      {/* 1. [좌측 사이드바] Stepper */}
      <aside className="flex flex-col items-center flex-shrink-0">
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

      {/* 2. [우측 컨텐츠] */}
      <section className="flex flex-col flex-1 min-w-120 max-w-200 overflow-hidden">
        
        {/* [고정 헤더] 스크롤 되지 않음 */}
        <header className="mb-10 shrink-0">
          <h1 className="text-h-1xl font-bold text-title mb-4.5">
            {currentConfig.title}
          </h1>
          { currentConfig.subTitle && <p className="text-b-xl text-sub">{currentConfig.subTitle}</p> }
        </header>

        {/* [스크롤 가능 영역] 실제 폼 내용 */}
        <article className="flex-1 overflow-y-auto scrollbar-hide pr-4 pb-10">
          {step === 1 && (
            <TextInput
              label="이름"
              value={formData.name}
              placeholder="이름을 입력해주세요"
              onChange={(val) => updateData('name', val)}
            />
          )}

          {step === 2 && (
            <div className="flex flex-col">
              <div className='flex flex-col gap-3.5'>
                <h3 className="text-b-md font-regular text-sub2">학습 분야</h3>
                <div className="flex flex-row gap-3.5 flex-wrap">
                  {Object.keys(SceneCategory).map((selected) => (
                    <button
                      key={selected}
                      onClick={() => updateData('preferCategory', selected)}
                      className={`px-4 py-2.5 rounded-[10px] text-b-lg font-regular border transition-all
                        ${formData.preferCategory === selected
                          ? 'bg-point-500 text-base-black border-point-500' 
                          : 'bg-bg-default text-sub2 border-border-default hover:border-border-hovered'
                        }`}
                    >
                      {selected}
                    </button>
                  ))}
                </div>
              </div>

              <div className='flex flex-col gap-3.5 mt-9.5'>
                <h3 className="text-b-md font-regular text-sub2">나의 학습 레벨</h3>
                <div className="flex flex-col gap-3">
                  {LEVEL_LIST.map((level) => (
                    <button
                      key={level.id}
                      disabled={!formData.preferCategory}
                      onClick={() => updateData('educationLevel', level.id)}
                      className={`w-full p-5 rounded-xl text-left text-b-lg font-medium border transition-all
                        ${formData.preferCategory
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

          {step === 3 && (
            <div>
              <h3 className="text-b-md font-regular text-sub2 mb-4">분야 (복수 선택 가능)</h3>
              <div className="grid grid-cols-3 gap-3">
                {SPECIALIZED_LIST.map((selected, index) => {
                  const isSelected = formData.specialized?.includes(selected);
                  return (
                    <button
                      key={selected}
                      onClick={()=>handleSpecializedSelect(selected, index)}
                      className={`border rounded-xl py-3.25 text-b-lg font-medium transition-all
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

          {step === 4 && (
            <div className="flex flex-col">
              <div>
                <h3 className="text-b-md font-regular text-sub2 mb-4">선호하는 색상 테마</h3>
                <div className="grid grid-cols-4 gap-3">
                  {THEME_LIST.map((t) => (
                    <button 
                      key={t.id}
                      onClick={() => updateData('themeColor', t.id)}
                      className={`bg-bg-default border rounded-xl px-5 py-4 transition-all
                        ${formData.themeColor === t.id ? 'border-point-500' : 'border-border-default hover:border-border-hovered'}`}
                    >
                      <div className='flex justify-center items-center gap-3'>
                        <div className='w-4 h-4 rounded-full' style={{ backgroundColor: t.color }} />
                        <span className="text-b-md font-medium">{t.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className='mt-9.5'>
                <h3 className="text-b-md font-regular text-sub2 mb-4">내가 원하는 어시스턴트의 역할</h3>
                <div className="grid grid-cols-2 gap-4">
                  {PERSONA_LIST.map((p) => (
                    <button 
                      key={p.id} 
                      onClick={() => updateData('persona', p.id)}
                      className={`border rounded-xl px-6.25 py-5 transition-all
                        ${formData.persona === p.id ? 'bg-bg-selected border-point-500' : 'bg-bg-default border-border-default hover:border-border-hovered'}`}
                    >
                      <div className='flex flex-col text-left'>
                        <p className={`text-b-lg font-semibold ${formData.persona === p.id ? 'text-base-black' : 'text-sub2'}`}>{p.role}</p>
                        <p className={`text-b-md font-regular ${formData.persona === p.id ? 'text-base-black' : 'text-sub'}`}>{p.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </article>

        {/* [고정 하단 바] */}
        <footer className="shrink-0 pt-13 flex gap-4 bg-surface">
          {step > 1 && (
            <button 
              onClick={prevStep} 
              disabled={isPending}
              className="px-6.5 py-4 rounded-[14px] text-b-md text-sub bg-bg-default border border-border-default hover:bg-bg-hovered disabled:opacity-50 transition-colors"
            >
              이전
            </button>
          )}
          <button
            onClick={nextStep}
            disabled={currentConfig.isNextDisabled || isPending}
            className={`px-15 py-4 rounded-[14px] text-b-md font-medium transition-all
              ${currentConfig.isNextDisabled || isPending 
                ? 'bg-bg-sub text-placeholder cursor-not-allowed' 
                : 'bg-point-500 text-base-black hover:opacity-90'
              }`}
          >
            {step === 4 ? "시작하기" : "다음으로"}
          </button>
        </footer>
      </section>
    </main>
  );
}