// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import ThemeProvider from "@/components/ThemeProvider";
import ThemeToggle from "@/components/ThemeToggle";
import { VT323 } from "next/font/google";

const vt323 = VT323({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-vt323",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Pixel Abyss",
  description: "Editor y prototipo TCG roguelike con pixel art",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${vt323.variable} subpixel-antialiased bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100`}
        style={{
          fontFamily:
            "var(--font-vt323), ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
          letterSpacing: "0.01em",
        }}
      >
        <ThemeProvider>
          <div className="min-h-dvh flex flex-col">
            <header className="border-b">
              <nav className="container mx-auto px-6 lg:px-8 h-14 flex items-center gap-4">
                <Link href="/" className="font-semibold">Editor</Link>
                <Link href="/game" className="text-muted-foreground hover:text-foreground">Juego</Link>
                <div className="ml-auto">
                  <ThemeToggle />
                </div>
              </nav>
            </header>

            <main className="container mx-auto px-6 lg:px-8 py-6 flex-1">
              {children}
            </main>

            <footer className="border-t text-xs text-muted-foreground py-3">
              <div className="container mx-auto px-6 lg:px-8">Pixel Abyss — prototipo</div>
            </footer>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
