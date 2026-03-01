export type PresenceStatus =
  | "none"        // 표시 안 함
  | "studying"    // 공부중
  | "coding"      // 코딩중
  | "gaming"      // 게임중
  | "researching" // 연구중
  | "blogging"    // 블로그 작성 중
  | "resting"     // 휴식중
  | "away";       // 자리 비움

const STORAGE_KEY = "personal-site-presence";

const DEFAULT: PresenceStatus = "none";

export const PRESENCE_OPTIONS: {
  value: PresenceStatus;
  label: string;
  emoji: string;
}[] = [
  { value: "none", label: "표시 안 함", emoji: "·" },
  { value: "studying", label: "공부중", emoji: "📚" },
  { value: "coding", label: "코딩중", emoji: "💻" },
  { value: "gaming", label: "게임중", emoji: "🎮" },
  { value: "researching", label: "연구중", emoji: "🔬" },
  { value: "blogging", label: "블로그 작성 중", emoji: "✍️" },
  { value: "resting", label: "휴식중", emoji: "☕" },
  { value: "away", label: "자리 비움", emoji: "🚶" },
];

export function getPresenceStatus(): PresenceStatus {
  if (typeof window === "undefined") return DEFAULT;
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return DEFAULT;
    const parsed = data as string;
    const valid = PRESENCE_OPTIONS.some((o) => o.value === parsed);
    if (valid) return parsed as PresenceStatus;
    const migrated: PresenceStatus = parsed === "available" || parsed === "busy" ? "none" : DEFAULT;
    localStorage.setItem(STORAGE_KEY, migrated);
    return migrated;
  } catch {
    return DEFAULT;
  }
}

export function setPresenceStatus(status: PresenceStatus) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, status);
  } catch {}
}
