import { GrassSectionData } from "@/app/_types/home";
import GrassSectionClient from "./GrassSectionClient";
import { $fetch } from "@/app/_utils/fetch";

const GrassSection = async () => {
  // "잔디" 정보 (GET /my/activity)
  const data: GrassSectionData = await $fetch("/my/activity");

  return <GrassSectionClient {...data} />
}

export default GrassSection;