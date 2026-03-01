"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { addQuest, getQuestsByDate } from "@/lib/quests";

const TODAY = new Date().toISOString().slice(0, 10);

const QUESTS_TO_ADD = [
  { title: "TEPS 단어 암기 1시간", rarity: "rare" as const, xp: 25, date: TODAY },
  { title: "TEPS 청해 집중 1시간", rarity: "rare" as const, xp: 25, date: TODAY },
  { title: "TEPS 독해 실전 1시간", rarity: "rare" as const, xp: 25, date: TODAY },
  { title: "세미나 논문 정리", rarity: "rare" as const, xp: 25, date: TODAY },
  { title: "준하님 추천 논문 정리", rarity: "rare" as const, xp: 25, date: TODAY },
  { title: "집 가기", rarity: "normal" as const, xp: 10, date: TODAY },
];

export default function SeedPage() {
  const router = useRouter();

  useEffect(() => {
    const existing = getQuestsByDate(TODAY).map((q) => q.title);
    for (const quest of QUESTS_TO_ADD) {
      if (!existing.includes(quest.title)) {
        addQuest(quest);
      }
    }
    router.replace("/quests");
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center text-[var(--muted-foreground)]">
      퀘스트 추가 중...
    </div>
  );
}
