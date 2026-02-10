import { Suspense } from "react";
import WelcomSection from "@/app/_components/home/WelcomeSection";
import GrassSection from "@/app/_components/home/GrassSection";
import LearningSection from "@/app/_components/home/LearningSection";
import RankingSection from "@/app/_components/home/RankingSection";
import ListSection from "@/app/_components/home/ListSection";
import Search from "@/app/_components/home/Search";
import OrderDropdown from "@/app/_components/home/OrderDropdown";
import Categories from "@/app/_components/home/Categories";

export default async function HomePage(props: {
  searchParams: Promise<{
    query?: string;
    order?: string;
    category?: string;
    curr?: string;
    rank?: string;
  }>;
}) {
  const searchParams = await props.searchParams;
  const query = searchParams?.query || '';
  const order = searchParams?.order || '';
  const category = searchParams?.category || '';
  const curr = searchParams?.curr || '';
  const rank = searchParams?.rank || '';

  return (
    <div className="flex flex-col w-full max-w-[1344px] my-13.75 gap-17.5 mx-auto">

      <div className="flex justify-between">
        {/* 환영 문구 */}
        <WelcomSection />
        {/* 잔디 */}
        <Suspense fallback={<></>}>
          <GrassSection />
        </Suspense>
      </div>

      <div className="flex gap-6.5">
        {/* 학습 중인 오브젝트 */}
        <Suspense fallback={<></>}>
          <LearningSection />
        </Suspense>
        {/* 오늘 사람들이 많이 학습한 오브젝트 */}
        <Suspense fallback={<></>}>
          <RankingSection rank={rank} />
        </Suspense>
      </div>

      {/* 오브젝트 모두 보기 */}
      <div className="flex flex-col">
        <Search />
        <div className="mt-6 mb-6 flex justify-between">
          <Categories />
          <OrderDropdown />
        </div>
        <Suspense fallback={<></>}>
          <ListSection query={query} order={order} category={category} curr={curr} />
        </Suspense>
      </div>
    </div>
  );
}