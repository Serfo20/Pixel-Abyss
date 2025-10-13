export type License = "CC0" | "CC-BY" | "CC-BY-SA" | "UNSPLASH" | "USER_OWNED" | "NONE";

export type MediaMeta = {
  sourceUrl?: string;
  author?: string;
  license?: License;
  licenseUrl?: string;
};

export type Tipo = {
  formato: "imagen" | "video" | "texto" | "plantilla";
  plataforma: "tiktok" | "instagram" | "x" | "reddit" | "youtube" | "web";
  rol: "meme" | "accion" | "evento";
};

export type Carta = {
  id: string;
  nombre: string;
  ilustracion?: string;
  fuerza: 0 | 1 | 2 | 3 | 4 | 5;
  coste: 0 | 1 | 2 | 3;
  tipo: Tipo;
  habilidad: string;
  keywords?: string[];
  media?: MediaMeta;
};
