import ObjectCard from "@/app/_components/home/ObjectCard";

export default function Playground() {
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
    </div>
  );
}