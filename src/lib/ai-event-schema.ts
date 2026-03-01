/**
 * AI 일정 생성 응답 형식
 */
export type AiEventItem = {
  title: string;
  date: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD, 선택 시 기간 일정
};

export function parseAiEvents(data: unknown): AiEventItem[] {
  if (!Array.isArray(data)) return [];
  return data
    .filter(
      (e: unknown): e is { title: string; date?: string; endDate?: string } =>
        e != null &&
        typeof e === "object" &&
        "title" in e &&
        typeof (e as { title: unknown }).title === "string"
    )
    .map((e) => {
      const date = String(e.date ?? e.endDate ?? "").trim().slice(0, 10);
      const endDate = e.endDate ? String(e.endDate).trim().slice(0, 10) : date;
      return {
        title: String(e.title).trim(),
        date: date || new Date().toISOString().slice(0, 10),
        endDate: endDate || date,
      };
    })
    .filter((e) => e.title.length > 0)
    .slice(0, 10);
}
