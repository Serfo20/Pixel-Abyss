"use client";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ThemeToggle() {
  const { theme, systemTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) {
    // evita desajustes de hidración
    return (
      <Button variant="outline" size="icon" aria-label="Cambiar tema" className="h-9 w-9" />
    );
  }

  const current = theme === "system" ? systemTheme : theme;
  const nextTheme = current === "dark" ? "light" : "dark";

  return (
    <Button
      variant="outline"
      size="icon"
      aria-label="Cambiar tema"
      className="relative h-9 w-9"
      onClick={() => setTheme(nextTheme || "light")}
    >
      {/* Sol (visible en light) */}
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      {/* Luna (visible en dark) */}
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Cambiar tema</span>
    </Button>
  );
}
