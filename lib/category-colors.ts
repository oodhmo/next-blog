const CLASS_MAP: Record<string, string> = {
  React: "cat-react",
  CSS: "cat-css",
  TypeScript: "cat-typescript",
  Performance: "cat-performance",
  Animation: "cat-animation",
};

export function getCategoryClass(name: string): string {
  return CLASS_MAP[name] ?? "cat-default";
}
