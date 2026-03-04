const WRONG_Q_KEY = "teps-vocab-wrong-all";

// ── Server sync helpers ──────────────────────────────────────────────────────

async function pushKey(key: string, value: unknown): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    await fetch("/api/store", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [key]: value }),
    });
  } catch {}
}

// Pull wrong Q IDs from server into localStorage (call on page mount)
export async function initTepsVocabProgress(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const res = await fetch("/api/store");
    if (!res.ok) return;
    const data = await res.json();
    if (data[WRONG_Q_KEY] != null) {
      localStorage.setItem(WRONG_Q_KEY, JSON.stringify(data[WRONG_Q_KEY]));
    }
  } catch {}
}

// ── Wrong Q ID tracking ──────────────────────────────────────────────────────

export function getWrongQIds(): number[] {
  if (typeof window === "undefined") return [];
  try {
    const d = localStorage.getItem(WRONG_Q_KEY);
    return d ? JSON.parse(d) : [];
  } catch { return []; }
}

export function addWrongQ(id: number) {
  const ids = getWrongQIds();
  if (!ids.includes(id)) {
    const newIds = [...ids, id];
    try { localStorage.setItem(WRONG_Q_KEY, JSON.stringify(newIds)); } catch {}
    pushKey(WRONG_Q_KEY, newIds);
  }
}

export function removeWrongQ(id: number) {
  const newIds = getWrongQIds().filter(i => i !== id);
  try { localStorage.setItem(WRONG_Q_KEY, JSON.stringify(newIds)); } catch {}
  pushKey(WRONG_Q_KEY, newIds);
}
