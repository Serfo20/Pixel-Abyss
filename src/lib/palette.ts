// DawnBringer16 + negro/blanco
export const DB16_BW: string[] = [
  "#000000","#FFFFFF",
  "#140C1C","#442434","#30346D","#4E4A4E",
  "#854C30","#346524","#D04648","#757161",
  "#597DCE","#D27D2C","#8595A1","#6DAA2C",
  "#D2AA99","#6DC2CA","#DAD45E","#DEEED6"
];

// 256 colores tipo RGB332 (opcional)
export const RGB332: string[] = Array.from({ length: 256 }, (_, i) => {
  const r = Math.round(((i >> 5) & 0x7) * 255 / 7);
  const g = Math.round(((i >> 2) & 0x7) * 255 / 7);
  const b = Math.round((i & 0x3) * 255 / 3);
  const hex = (n: number) => n.toString(16).padStart(2, "0");
  return `#${hex(r)}${hex(g)}${hex(b)}`;
});
