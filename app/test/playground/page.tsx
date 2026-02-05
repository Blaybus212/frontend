import ObjectCard from "@/app/_components/home/ObjectCard";
import SummaryCard, { GrassLevel } from "@/app/_components/home/SummaryCard";

export default function Playground() {
  const grassData: GrassLevel[][] = [
    [0, 0, 0, 0, 0, 4, 0, 2, 0, 3],
    [4, 0, 2, 4, 0, 2, 4, 4, 4, 2],
    [0, 4, 0, 0, 0, 0, 0, 0, 0, 1],
    // ... 이런식으로 4개 행을 구성
  ];

  return (
    <div className="p-4 bg-white">
      <ObjectCard 
        imageSrc="/images/objectcard_example.png"
        title="로봇 팔"
        subtitle="Robot Arm"
        category="기계공학"
        progress={68}
        isPopular={true}
      />
      <br/>
      <SummaryCard 
        month="Feb"
        colorType="green"
        grassData={grassData}
        maxStreak={11}
        solvedQuizzes={25}
      />
    </div>
  );
}