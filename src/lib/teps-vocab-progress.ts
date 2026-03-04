const WRONG_Q_KEY = "teps-vocab-wrong-all";

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
    try { localStorage.setItem(WRONG_Q_KEY, JSON.stringify([...ids, id])); } catch {}
  }
}

export function removeWrongQ(id: number) {
  const ids = getWrongQIds().filter(i => i !== id);
  try { localStorage.setItem(WRONG_Q_KEY, JSON.stringify(ids)); } catch {}
}
