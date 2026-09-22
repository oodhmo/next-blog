import type { CategoryColor } from "@/lib/category-colors";

type CategoryBadgeProps = {
  name: string;
  colorMap: Record<string, CategoryColor>;
};

export function CategoryBadge({ name, colorMap }: CategoryBadgeProps) {
  const c = colorMap[name];
  return (
    <span
      className="rounded-full border font-mono text-[10px] font-medium uppercase tracking-[1.5px] px-2.5 py-1"
      style={c ? { color: c.text, background: c.bg, borderColor: c.border } : {}}
    >
      {name}
    </span>
  );
}
