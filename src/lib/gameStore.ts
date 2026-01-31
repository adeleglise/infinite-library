"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import Decimal from "break_infinity.js";
import { GameStore, Generator } from "./types";
import { initialGenerators } from "@/data/generators";

// Helper to ensure a value is a Decimal
function ensureDecimal(value: unknown): Decimal {
  if (value instanceof Decimal) return value;
  if (typeof value === "number" || typeof value === "string") {
    return new Decimal(value);
  }
  if (value && typeof value === "object" && "__decimal" in value) {
    return new Decimal((value as { __decimal: string }).__decimal);
  }
  return new Decimal(0);
}

// Helper to recursively convert __decimal objects to Decimal instances
function hydrateDecimals(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === "object") {
    // Check if this is a serialized Decimal
    if ("__decimal" in (obj as Record<string, unknown>)) {
      return new Decimal((obj as { __decimal: string }).__decimal);
    }
    
    // Handle arrays
    if (Array.isArray(obj)) {
      return obj.map(hydrateDecimals);
    }
    
    // Handle objects
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(obj as Record<string, unknown>)) {
      result[key] = hydrateDecimals((obj as Record<string, unknown>)[key]);
    }
    return result;
  }
  
  return obj;
}

// Helper to recursively convert Decimal instances to serializable objects
function serializeDecimals(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  
  if (obj instanceof Decimal) {
    return { __decimal: obj.toString() };
  }
  
  if (typeof obj === "object") {
    if (Array.isArray(obj)) {
      return obj.map(serializeDecimals);
    }
    
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(obj as Record<string, unknown>)) {
      result[key] = serializeDecimals((obj as Record<string, unknown>)[key]);
    }
    return result;
  }
  
  return obj;
}

// Custom storage to handle Decimal serialization
const customStorage = {
  getItem: (name: string): { state: Partial<GameStore> } | null => {
    try {
      const str = localStorage.getItem(name);
      if (!str) return null;
      const parsed = JSON.parse(str);
      return hydrateDecimals(parsed) as { state: Partial<GameStore> };
    } catch (e) {
      console.error("Failed to load game state:", e);
      return null;
    }
  },
  setItem: (name: string, value: { state: Partial<GameStore> }) => {
    try {
      const serialized = serializeDecimals(value);
      localStorage.setItem(name, JSON.stringify(serialized));
    } catch (e) {
      console.error("Failed to save game state:", e);
    }
  },
  removeItem: (name: string) => {
    localStorage.removeItem(name);
  },
};

const initialState = {
  // Resources
  glyphs: new Decimal(0),
  vocables: new Decimal(0),
  fragments: new Decimal(0),
  codex: new Decimal(0),

  // Generators
  generators: initialGenerators,

  // Upgrades
  upgrades: [],

  // Prestige
  prestigeLayers: [
    {
      id: "lexicon",
      name: "Lexique",
      currency: "vocables",
      currencyIcon: "📖",
      multiplier: new Decimal(1),
      requirement: new Decimal(1000),
      timesReset: 0,
    },
  ],

  // Stats
  totalGlyphsEarned: new Decimal(0),
  totalClicks: 0,
  playTime: 0,
  lastSave: Date.now(),

  // Settings
  notation: "scientific" as const,
};

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Core actions
      addGlyphs: (amount: Decimal) => {
        set((state) => ({
          glyphs: ensureDecimal(state.glyphs).add(amount),
          totalGlyphsEarned: ensureDecimal(state.totalGlyphsEarned).add(amount),
        }));
      },

      click: () => {
        const clickPower = get().getClickPower?.() || new Decimal(1);
        set((state) => ({
          glyphs: ensureDecimal(state.glyphs).add(clickPower),
          totalGlyphsEarned: ensureDecimal(state.totalGlyphsEarned).add(clickPower),
          totalClicks: state.totalClicks + 1,
        }));
      },

      // Generator actions
      buyGenerator: (id: string) => {
        const state = get();
        const cost = state.getGeneratorCost(id);
        const glyphs = ensureDecimal(state.glyphs);

        if (glyphs.gte(cost)) {
          set((state) => ({
            glyphs: ensureDecimal(state.glyphs).sub(cost),
            generators: state.generators.map((g) =>
              g.id === id ? { ...g, owned: g.owned + 1 } : g
            ),
          }));
        }
      },

      getGeneratorCost: (id: string) => {
        const generator = get().generators.find((g) => g.id === id);
        if (!generator) return new Decimal(Infinity);
        const baseCost = ensureDecimal(generator.baseCost);
        return baseCost.mul(
          Decimal.pow(generator.costMultiplier, generator.owned)
        );
      },

      getGeneratorProduction: (id: string) => {
        const generator = get().generators.find((g) => g.id === id);
        if (!generator) return new Decimal(0);
        const baseProduction = ensureDecimal(generator.baseProduction);
        return baseProduction.mul(generator.owned);
      },

      getTotalProduction: () => {
        const state = get();
        return state.generators.reduce((total, g) => {
          return ensureDecimal(total).add(state.getGeneratorProduction(g.id));
        }, new Decimal(0));
      },

      getClickPower: () => {
        // Base click power + bonuses from upgrades
        return new Decimal(1);
      },

      // Upgrade actions
      buyUpgrade: (id: string) => {
        const state = get();
        const upgrade = state.upgrades.find((u) => u.id === id);
        if (!upgrade || upgrade.purchased) return;

        const glyphs = ensureDecimal(state.glyphs);
        const cost = ensureDecimal(upgrade.cost);
        
        if (glyphs.gte(cost)) {
          upgrade.effect();
          set((state) => ({
            glyphs: ensureDecimal(state.glyphs).sub(cost),
            upgrades: state.upgrades.map((u) =>
              u.id === id ? { ...u, purchased: true } : u
            ),
          }));
        }
      },

      // Prestige actions
      prestige: (layerId: string) => {
        const state = get();
        if (!state.canPrestige(layerId)) return;

        const gain = state.getPrestigeGain(layerId);
        const layer = state.prestigeLayers.find((l) => l.id === layerId);

        if (layer && layer.currency === "vocables") {
          set((state) => ({
            vocables: ensureDecimal(state.vocables).add(gain),
            glyphs: new Decimal(0),
            generators: initialGenerators,
            prestigeLayers: state.prestigeLayers.map((l) =>
              l.id === layerId ? { ...l, timesReset: l.timesReset + 1 } : l
            ),
          }));
        }
      },

      canPrestige: (layerId: string) => {
        const state = get();
        const layer = state.prestigeLayers.find((l) => l.id === layerId);
        if (!layer) return false;
        const glyphs = ensureDecimal(state.glyphs);
        const requirement = ensureDecimal(layer.requirement);
        return glyphs.gte(requirement);
      },

      getPrestigeGain: (layerId: string) => {
        const state = get();
        const layer = state.prestigeLayers.find((l) => l.id === layerId);
        if (!layer) return new Decimal(0);

        const glyphs = ensureDecimal(state.glyphs);
        const requirement = ensureDecimal(layer.requirement);
        
        // Formula: sqrt(glyphs / requirement)
        return Decimal.floor(
          Decimal.sqrt(glyphs.div(requirement))
        );
      },

      // Game loop
      tick: (deltaTime: number) => {
        const state = get();
        const production = state.getTotalProduction();
        const earned = production.mul(deltaTime);

        if (earned.gt(0)) {
          set((state) => ({
            glyphs: ensureDecimal(state.glyphs).add(earned),
            totalGlyphsEarned: ensureDecimal(state.totalGlyphsEarned).add(earned),
            playTime: state.playTime + deltaTime,
          }));
        } else {
          set((state) => ({
            playTime: state.playTime + deltaTime,
          }));
        }
      },

      // Save/Load
      save: () => {
        set({ lastSave: Date.now() });
      },

      load: () => {
        // Handled by persist middleware
      },

      reset: () => {
        set(initialState);
      },

      // Offline progress
      calculateOfflineProgress: (seconds: number) => {
        const state = get();
        const production = state.getTotalProduction();
        // 50% efficiency for offline progress
        return ensureDecimal(production).mul(seconds).mul(0.5);
      },
    }),
    {
      name: "infinite-library-save",
      storage: customStorage,
    }
  )
);
