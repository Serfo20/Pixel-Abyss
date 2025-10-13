"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Card = { id: string; name: string; cost: number; effect: "atk" | "def" | "heal" };
export type Player = { x: number; y: number; hp: number; hpMax: number; level: number; xp: number; pixels: number; deck: string[]; artIds: string[]; };
export type World = { seed: string; w: number; h: number; tiles: number[]; }; // 0=pradera,1=bosque,2=ruina

type GameState = {
  player: Player; world: World; cards: Record<string,Card>;
  startRun: (seed?: string)=>void; move:(dx:number,dy:number)=>void; grantPixels:(n:number)=>void;
};

export const useGame = create<GameState>()(persist((set,get)=>({
  player: { x:2,y:2,hp:10,hpMax:10,level:1,xp:0,pixels:0,deck:["c_strike","c_guard","c_focus"], artIds:[] },
  world: { seed:"demo", w:48, h:36, tiles: Array(48*36).fill(0) },
  cards: {
    c_strike:{ id:"c_strike", name:"Golpe", cost:1, effect:"atk" },
    c_guard: { id:"c_guard",  name:"Guardia", cost:1, effect:"def" },
    c_focus: { id:"c_focus",  name:"Concentrar", cost:0, effect:"heal" },
  },
  startRun: (seed = Math.random().toString(36).slice(2))=>{
    const w=48,h=36;
    const tiles = Array(w*h).fill(0).map((_,i)=>{
      const x=i%w,y=(i/w)|0;
      if (x===0||y===0||x===w-1||y===h-1) return 1;
      return (x*y)%37===0 ? 2 : 0;
    });
    set({ world:{ seed,w,h,tiles }, player:{ ...get().player, x:2,y:2,hp:get().player.hpMax } });
  },
  move:(dx,dy)=>{
    const { player, world } = get();
    const nx=Math.max(0,Math.min(world.w-1, player.x+dx));
    const ny=Math.max(0,Math.min(world.h-1, player.y+dy));
    set({ player:{ ...player, x:nx, y:ny } });
    const t = world.tiles[ny*world.w+nx];
    if (t===2) get().grantPixels(1);
  },
  grantPixels:(n)=> set(s=>({ player:{ ...s.player, pixels:s.player.pixels+n } }))
}),{ name:"pixel-abyss-save" }));
