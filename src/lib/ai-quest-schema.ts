/**
 * AI 퀘스트 생성 응답 형식 - 통일된 스키마
 */
export type AiQuestItem = {
  title: string;
  rarity: "normal" | "rare" | "epic" | "legendary";
};

export const AI_QUEST_RARITIES = ["normal", "rare", "epic", "legendary"] as const;

export function parseAiQuests(data: unknown): AiQuestItem[] {
  if (!Array.isArray(data)) return [];
  return data
    .filter(
      (q: unknown): q is { title: string; rarity?: string } =>
        q != null &&
        typeof q === "object" &&
        "title" in q &&
        typeof (q as { title: unknown }).title === "string"
    )
    .map((q) => ({
      title: String(q.title).trim(),
      rarity: AI_QUEST_RARITIES.includes((q.rarity as AiQuestItem["rarity"]) ?? "normal")
        ? (q.rarity as AiQuestItem["rarity"])
        : "normal",
    }))
    .filter((q) => q.title.length > 0)
    .slice(0, 10);
}
