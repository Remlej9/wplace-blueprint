export type ColorTier = "free" | "premium";


export type PaletteColor = {
  name: string;
  hex: string;
  tier: ColorTier;
};

export const PALETTE: PaletteColor[] = [
  // ==== FREE COLORS ====
  { name: "Black",          hex: "#000000", tier: "free" },
  { name: "Dark Gray",      hex: "#3c3c3c", tier: "free" },
  { name: "Gray",           hex: "#787878", tier: "free" },
  { name: "Light Gray",     hex: "#d2d2d2", tier: "free" },
  { name: "White",          hex: "#ffffff", tier: "free" },
  { name: "Deep Red",       hex: "#600018", tier: "free" },
  { name: "Red",            hex: "#ed1c24", tier: "free" },
  { name: "Orange",         hex: "#ff7f27", tier: "free" },
  { name: "Gold",           hex: "#f6aa09", tier: "free" },
  { name: "Yellow",         hex: "#f9dd3b", tier: "free" },
  { name: "Light Yellow",   hex: "#fffabc", tier: "free" },
  { name: "Dark Green",     hex: "#0eb968", tier: "free" },
  { name: "Green",          hex: "#13e67b", tier: "free" },
  { name: "Light Green",    hex: "#87ff5e", tier: "free" },
  { name: "Dark Teal",      hex: "#0c816e", tier: "free" },
  { name: "Teal",           hex: "#10aea6", tier: "free" },
  { name: "Light Teal",     hex: "#13e1bc", tier: "free" },
  { name: "Cyan",           hex: "#60f7f2", tier: "free" },
  { name: "Dark Blue",      hex: "#28509e", tier: "free" },
  { name: "Blue",           hex: "#4093e4", tier: "free" },
  { name: "Indigo",         hex: "#6b50f6", tier: "free" },
  { name: "Light Indigo",   hex: "#99b1fb", tier: "free" },
  { name: "Dark Purple",    hex: "#780c99", tier: "free" },
  { name: "Purple",         hex: "#aa38b9", tier: "free" },
  { name: "Light Purple",   hex: "#e09ff9", tier: "free" },
  { name: "Dark Pink",      hex: "#cb007a", tier: "free" },
  { name: "Pink",           hex: "#ec1f80", tier: "free" },
  { name: "Light Pink",     hex: "#f38da9", tier: "free" },
  { name: "Dark Brown",     hex: "#684634", tier: "free" },
  { name: "Brown",          hex: "#95682a", tier: "free" },
  { name: "Beige",          hex: "#f8b277", tier: "free" },

  // ==== PREMIUM COLORS ====
  { name: "Medium Gray",        hex: "#aaaaaa", tier: "premium" },
  { name: "Dark Red",           hex: "#a50e1e", tier: "premium" },
  { name: "Light Red",          hex: "#fa8072", tier: "premium" },
  { name: "Dark Orange",        hex: "#e45c1a", tier: "premium" },
  { name: "Dark Goldenrod",     hex: "#9c8431", tier: "premium" },
  { name: "Goldenrod",          hex: "#c5ad31", tier: "premium" },
  { name: "Light Goldenrod",    hex: "#e8d45f", tier: "premium" },
  { name: "Dark Olive",         hex: "#4a6b3a", tier: "premium" },
  { name: "Olive",              hex: "#5a944a", tier: "premium" },
  { name: "Light Olive",        hex: "#84c573", tier: "premium" },
  { name: "Dark Cyan",          hex: "#0f799f", tier: "premium" },
  { name: "Light Cyan",         hex: "#bbfaf2", tier: "premium" },
  { name: "Light Blue",         hex: "#7dc7ff", tier: "premium" },
  { name: "Dark Indigo",        hex: "#4d31b8", tier: "premium" },
  { name: "Dark Slate Blue",    hex: "#4a4284", tier: "premium" },
  { name: "Slate Blue",         hex: "#7a71c4", tier: "premium" },
  { name: "Light Slate Blue",   hex: "#b5aef1", tier: "premium" },
  { name: "Dark Peach",         hex: "#9b5249", tier: "premium" },
  { name: "Peach",              hex: "#d18078", tier: "premium" },
  { name: "Light Peach",        hex: "#fab6a4", tier: "premium" },
  { name: "Light Brown",        hex: "#dba463", tier: "premium" },
  { name: "Dark Tan",           hex: "#7b6352", tier: "premium" },
  { name: "Tan",                hex: "#9c846b", tier: "premium" },
  { name: "Light Tan",          hex: "#d6b594", tier: "premium" },
  { name: "Dark Beige",         hex: "#d18051", tier: "premium" },
  { name: "Light Beige",        hex: "#ffc5a5", tier: "premium" },
  { name: "Dark Stone",         hex: "#6d643f", tier: "premium" },
  { name: "Stone",              hex: "#948c6b", tier: "premium" },
  { name: "Light Stone",        hex: "#cdc59e", tier: "premium" },
  { name: "Dark Slate",         hex: "#333941", tier: "premium" },
  { name: "Slate",              hex: "#6d758d", tier: "premium" },
  { name: "Light Slate",        hex: "#b3b9d1", tier: "premium" },
];

// Helper: hex -> [r,g,b]
export function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const bigint = parseInt(clean, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return [r, g, b];
}