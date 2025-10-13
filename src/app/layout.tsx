import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import ThemeProvider from "@/components/ThemeProvider";
import ThemeToggle from "@/components/ThemeToggle";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Pixel Abyss",
  description: "Editor y prototipo TCG roguelike con pixel art",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100`}
      >
        <ThemeProvider>
          <div className="min-h-dvh flex flex-col">
            <header className="border-b">
              <nav className="container mx-auto px-4 h-12 flex items-center gap-4">
                <Link href="/" className="font-semibold">Editor</Link>
                <Link href="/game" className="text-muted-foreground hover:text-foreground">Juego</Link>
                <div className="ml-auto">
                  <ThemeToggle />
                </div>
              </nav>
            </header>

            <main className="container mx-auto px-4 py-6 flex-1">
              {children}
            </main>

            <footer className="border-t text-xs text-muted-foreground py-3">
              <div className="container mx-auto px-4">Pixel Abyss — prototipo</div>
            </footer>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}

