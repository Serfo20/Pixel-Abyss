// src/app/page.tsx
import type { Metadata } from "next";
import PixelEditor from "@/components/PixelEditor";

export const metadata: Metadata = {
  title: "Pixel Abyss — Editor",
};

const PALETTE = [
  "#000000", "#ffffff", "#ff004d", "#ffa300",
  "#ffec27", "#00e436", "#29adff", "#83769c",
  "#ff77a8", "#ffccaa"
];

export default function HomePage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Editor de píxeles</h1>
      <PixelEditor
        width={32}
        height={32}
        scale={14}
        exportScale={14}
        minCells={0}
        palette={PALETTE}
        advanced={true}   // ponlo en false si no quieres el prompt box
      />
    </div>
  );
}
