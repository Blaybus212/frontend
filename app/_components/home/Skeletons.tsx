'use client';

export const GrassSectionSkeleton = () => {
  return (
    <div className="flex items-center gap-7.5 px-7.5 py-4.5 rounded-[14px] bg-bg-default animate-pulse">
      <div>
        <div className='flex flex-row items-center gap-2 mb-3'>
          <div className="w-6 h-6 rounded-full bg-bg-sub" />
          <div className="w-12 h-6 rounded bg-bg-sub" />
          <div className="w-6 h-6 rounded-full bg-bg-sub" />
        </div>
        
        <div className="grid grid-cols-10 grid-flow-row gap-[7.23px]">
          {Array.from({ length: 30 }).map((_, index) => (
            <div
              key={index}
              className="w-5.25 h-5.25 rounded-md bg-bg-hovered"
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5 min-w-35 max-h-min">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-sm bg-bg-sub" />
            <div className="w-20 h-4 rounded bg-bg-sub" />
          </div>
          <div className="w-12 h-7 rounded bg-bg-sub" />
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-sm bg-bg-sub" />
            <div className="w-20 h-4 rounded bg-bg-sub" />
          </div>
          <div className="w-12 h-7 rounded bg-bg-sub" />
        </div>
      </div>
    </div>
  );
};

export const LearningSectionSkeleton = () => {
  return (
    <div className="flex flex-col gap-5 items-start animate-pulse">
      <div className="flex gap-2 items-center">
        <div className="w-5 h-5 rounded-sm bg-bg-sub" />
        <div className="w-36 h-7 rounded bg-bg-sub" />
      </div>

      <div className="flex flex-row gap-5">
        {Array.from({ length: 3 }).map((_, index) => (
          <div 
            key={index} 
            className="w-70 rounded-[14px] overflow-hidden bg-bg-default"
          >
            <div className="w-70 h-52.5 bg-bg-sub" />

            <div className="p-4 space-y-4">
              <div className="space-y-2">
                <div className="w-32 h-6 rounded bg-bg-sub" />
                <div className="w-24 h-5 rounded bg-bg-hovered" />
              </div>
              
              <div>
                <div className="w-16 h-7 rounded-full bg-bg-hovered" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="w-16 h-4 rounded bg-bg-hovered" />
                  <div className="w-8 h-4 rounded bg-bg-hovered" />
                </div>
                
                <div className="w-full h-2 bg-bg-hovered rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const RankingSectionSkeleton = () => {
  return (
    <div className="flex flex-col gap-5 items-start animate-pulse">
      <div className="w-full flex items-center">
        <div className="w-5 h-5 rounded-sm bg-bg-sub" />
        <div className="w-64 h-7 rounded bg-bg-sub ml-2 mr-auto" />
        <div className="w-24 h-4 rounded bg-bg-hovered" />
      </div>

      <div className="flex flex-row gap-5">
        <div className="flex flex-col justify-end w-109.25 px-6 py-[12.5px] rounded-[14px] bg-bg-default">
          <div className="flex p-1 bg-bg-sub rounded-lg ml-auto mb-4">
            <div className="w-20 h-8 rounded-lg bg-bg-hovered" />
            <div className="w-20 h-8 rounded-lg bg-bg-hovered" />
          </div>

          <div className="flex flex-col gap-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="flex items-center justify-between px-3 py-3.5"
              >
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-bg-sub" />
                  <div className="flex flex-col gap-2">
                    <div className="w-32 h-5 rounded bg-bg-sub" />
                    <div className="w-24 h-4 rounded bg-bg-hovered" />
                  </div>
                </div>
                <div className="w-8 h-4 rounded bg-bg-hovered" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export const ModelGridSkeleton = () => {
  return (
    <div className="grid grid-cols-3 gap-x-5 gap-y-10 animate-pulse">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="w-full max-w-108 rounded-[14px] overflow-hidden bg-bg-default">
          
          <div className="w-full h-52.5 bg-bg-sub" />

          <div className="px-4 py-[16.56px] space-y-3.5">
            <div className="flex items-baseline gap-1.5">
              <div className="w-24 h-6 rounded bg-bg-sub" />
              <div className="w-16 h-5 rounded bg-bg-hovered" />
            </div>

            <div className="space-y-2">
              <div className="w-full h-4 rounded bg-bg-hovered" />
              <div className="w-4/5 h-4 rounded bg-bg-hovered" />
            </div>

            <div className="flex items-center justify-between pt-px">
              <div className="w-16 h-7 rounded-full bg-bg-hovered" />
              <div className="flex items-center gap-1">
                <div className="w-6 h-6 rounded-full bg-bg-sub" />
                <div className="w-8 h-4 rounded bg-bg-hovered" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};