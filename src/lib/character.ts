export type CharacterCustomization = {
  skinColor: string;
  hairColor: string;
  hairStyle: "short" | "long" | "spiky" | "bald";
  shirtColor: string;
  pantsColor: string;
  accessory: "none" | "hat" | "glasses" | "scarf";
};

const STORAGE_KEY = "personal-site-character";

const DEFAULTS: CharacterCustomization = {
  skinColor: "#fcd5b8",
  hairColor: "#4a3728",
  hairStyle: "short",
  shirtColor: "#3b82f6",
  pantsColor: "#1e3a5f",
  accessory: "none",
};

export function getCharacterCustomization(): CharacterCustomization {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return DEFAULTS;
    return { ...DEFAULTS, ...JSON.parse(data) };
  } catch {
    return DEFAULTS;
  }
}

export function saveCharacterCustomization(customization: CharacterCustomization) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customization));
  } catch {}
}

export const SKIN_OPTIONS = [
  "#fcd5b8", "#e8c4a0", "#d4a574", "#c68642", "#8d5524",
];

export const HAIR_OPTIONS = [
  "#4a3728", "#2d1f14", "#8b4513", "#daa520", "#ff6347", "#2c1810",
];

export const SHIRT_OPTIONS = [
  "#3b82f6", "#dc2626", "#16a34a", "#ca8a04", "#7c3aed", "#0d9488",
];

export const PANTS_OPTIONS = [
  "#1e3a5f", "#1f2937", "#44403c", "#713f12", "#4c1d95",
];
