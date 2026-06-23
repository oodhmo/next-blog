export type CategoryColor = { text: string; bg: string; border: string };

const CATEGORY_COLORS: CategoryColor[] = [
  { text: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" }, // blue
  { text: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" }, // green
  { text: "#9333ea", bg: "#faf5ff", border: "#e9d5ff" }, // purple
  { text: "#dc2626", bg: "#fef2f2", border: "#fecaca" }, // red
  { text: "#ea580c", bg: "#fff7ed", border: "#fed7aa" }, // orange
  { text: "#0891b2", bg: "#ecfeff", border: "#a5f3fc" }, // cyan
  { text: "#be123c", bg: "#fff1f2", border: "#fecdd3" }, // rose
  { text: "#4f46e5", bg: "#eef2ff", border: "#c7d2fe" }, // indigo
];

export function buildCategoryColorMap(
  categories: string[]
): Record<string, CategoryColor> {
  return Object.fromEntries(
    categories.map((name, i) => [name, CATEGORY_COLORS[i % CATEGORY_COLORS.length]])
  );
}
