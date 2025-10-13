# Pixel Abyss

_Un RPG roguelike–TCG single‑player (expandible a coop) en un abismo infinito por capas, con creación de arte en pixel art curado por la comunidad._

> **Estado:** prototipo en desarrollo (MVP).

---

## ✨ Características (MVP actual)
- **Mapa por tiles** con cámara centrada y grilla sutil (seed determinista).
- **Encuentros** al colisionar con entidades → modal de batalla (placeholder con “Huir”).
- **Editor de pixel art** en navegador: zoom, export PNG, cuentagotas, paletas DB16 y RGB332, pixelado desde imagen externa.
- **Integración IA (opcional)**: endpoint `/api/prompt-image` via Replicate para generar imagen por prompt y cuantizar a paleta.
- **Stack**: Next.js (App Router) + TypeScript + Tailwind v4 (CLI) + shadcn/ui + Zustand + PixiJS v8 + next-themes (dark/light).

---

## 📦 Requisitos
- **Node.js** 20.x o 22.x
- **pnpm** (recomendado) o npm/yarn
- Cuenta y **API token de Replicate** (solo si usarás el prompt→imagen).

---

## 🚀 Inicio rápido

```bash
# 1) Clonar
git clone https://github.com/Serfo20/Pixel-Abyss.git
cd Pixel-Abyss

# 2) Dependencias
pnpm install
# o: npm install

# 3) Variables de entorno
cp .env.example .env.local  # si existe .env.example

# 4) Desarrollo
pnpm dev
# abre http://localhost:3000
```

### Variables de entorno (/.env.local)
```bash
# IA (opcional)
REPLICATE_API_TOKEN=tu_token
REPLICATE_MODEL=stability-ai/sdxl  # ejemplo; reemplázalo si usas otro
# App
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

> Si no defines `REPLICATE_API_TOKEN`, el editor funciona igual; solo se desactiva el flujo prompt→imagen.

---

## 🧰 Scripts útiles
```bash
pnpm dev         # modo desarrollo
pnpm build       # build de producción
pnpm start       # sirve .next/ con Node
pnpm lint        # ESLint
pnpm typecheck   # verificación TypeScript
pnpm format      # Prettier
```

---

## 🗂️ Estructura (resumen)
```
/public          # assets estáticos
/src
  /app           # App Router (Next.js)
  /components    # UI y piezas reutilizables (shadcn/ui)
  /lib           # helpers (estado, utils, persistencia)
  /game          # mapa, encuentros, biomas, PixiJS
  /editor        # editor de pixel art
  /styles        # Tailwind (v4 CLI)
```

---

## 🕹️ Loop básico
1. Exploras el grid (biomas/POIs).
2. Disparas eventos/encuentros.
3. Botín: píxeles, habilidades, canvases, cartas.
4. Usas píxeles para pixelar arte y montar cartas/equipo.
5. Votas y recibes/otorgas bonos por arte popular.
6. Reintentas y avanzas más profundo (capas más duras, jefe por piso).

---

## 🧩 Sistemas principales (resumen)
- **Movimiento & mapa:** ruido determinista (seed) + landmarks raros.
- **Encuentros:** trigger por colisión de celda → modal de batalla.
- **TCG/Build:** habilidades “slotables” en canvases; arte popular otorga bonus con caps.
- **Progresión:** muerte no definitiva (castiga botín); XP lenta; oficios abiertos.
- **Moderación & licencias:** foco en pixel art original; reglas de contribución y atribución claras.

---

## 🛣️ Roadmap corto
- **v0.1 (MVP encuentros/loot):** combate por turnos simple, POIs mínimos, inventario/loadout (3 slots + 1 pasivo), persistencia local (IndexedDB).
- **v0.2 (TCG + biomas):** mano dinámica, efectos de estado, 3 biomas + jefe.
- **v0.3 (UGC curado):** colas de arte, votos ponderados por reputación, decay y caps de bonus.

### Tareas inmediatas
- Encuentro jugable con outcome real (victoria/derrota → botín → back to map).
- POIs: cofres/ruinas que otorgan habilidades/canvases.
- Inventario MVP con costes en píxeles y vista de bonus.
- Persistencia de run (seed, piso, pos, HP, loadout, botín).

---

## 🎨 Paletas / Créditos
- **DB16** (DawnBringer 16) y **RGB332 (256)** para cuantización.
- shadcn/ui, PixiJS, Zustand, TailwindCSS, Next.js — ¡gracias a sus autores!

---

## 🤝 Contribuir
1. Crea una rama `feat/…` o `fix/…`.
2. Usa `pnpm lint && pnpm typecheck` antes del PR.
3. Incluye una nota corta de diseño si afecta balance/UX.

> Issues sugeridas: _Encuentro jugable MVP_, _Inventario + loadout_, _Persistencia local_, _POIs mínimos_, _Audio stingers_.

---

## 📄 Licencia
MIT © 2025 Serfo — Puedes cambiarla cuando quieras (por ejemplo, a AGPL si prefieres “copyleft”).

---

## 🆘 Troubleshooting
- **No arranca el editor IA:** falta `REPLICATE_API_TOKEN` o el modelo no existe.
- **Bajo rendimiento del mapa:** activa chunking / reduce entidades por viewport en `/src/game`.
- **Estilos raros:** asegúrate de correr Tailwind v4 CLI (scripts del repo) y purga habilitada.
