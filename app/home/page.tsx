import { signOut } from "@/auth";

type UserInfo = {
  name: string;
};

export default async function HomePage() {

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#12141c] text-white">
      <div className="rounded-3xl bg-[#1c1f2a] p-12 shadow-2xl border border-white/5">
        <form action={async () => {
          'use server';
          await signOut({ redirectTo: "/login" });
        }}>
          <button className="w-full rounded-xl bg-[#d4ff59] py-4 font-bold text-black hover:bg-[#c2eb4c] transition-colors">
            로그아웃
          </button>
        </form>
      </div>
    </div>
  );
}