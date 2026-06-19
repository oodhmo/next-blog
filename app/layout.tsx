import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import NextTopLoader from "nextjs-toploader";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: {
    default: "dvlog_",
    template: "%s | dvlog_",
  },
  description: "프론트엔드 개발 경험, 삽질 기록, 그리고 가끔 딴 생각들.",
  keywords: ["Next.js", "TypeScript", "TailwindCSS", "Blog"],
  openGraph: {
    type: "website",
    locale: "ko_KR",
    title: "dvlog_",
    description: "프론트엔드 개발 경험, 삽질 기록, 그리고 가끔 딴 생각들.",
    siteName: "dvlog_",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body
        className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} antialiased min-h-screen bg-background font-sans`}
      >
        <NextTopLoader showSpinner={false} color="var(--color-primary)" />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster theme="system" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
