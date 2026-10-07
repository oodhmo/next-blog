import { SITE_NAME } from "@/lib/constants";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-border">
      <div className="page-container py-7">
        <div className="flex items-center justify-between font-mono text-[11px] text-muted-foreground">
          <span>{SITE_NAME} © {currentYear}</span>
          <span>built with ☕ &amp; curiosity</span>
        </div>
      </div>
    </footer>
  );
}
