"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import Decimal from "break_infinity.js";
import { GameStore, Generator } from "./types";
import { initialGenerators } from "@/data/generators";

// Custom storage to handle Decimal serialization
const customStorage = {
  getItem: (name: string) => {
    const str = localStorage.getItem(name);
    if (!str) return null;
    return JSON.parse(str, (key, value) => {
      if (value && typeof value === "object" && "__decimal" in value) {
        return new Decimal(value.__decimal);
      }
      return value;
    });
  },
  setItem: (name: string, value: unknown) => {
    localStorage.setItem(
      name,
      JSON.stringify(value, (key, val) => {
        if (val instanceof Decimal) {
          return { __decimal: val.toString() };
        }
        return val;
      })
    );
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
          glyphs: state.glyphs.add(amount),
          totalGlyphsEarned: state.totalGlyphsEarned.add(amount),
        }));
      },

      click: () => {
        const clickPower = get().getClickPower?.() || new Decimal(1);
        set((state) => ({
          glyphs: state.glyphs.add(clickPower),
          totalGlyphsEarned: state.totalGlyphsEarned.add(clickPower),
          totalClicks: state.totalClicks + 1,
        }));
      },

      // Generator actions
      buyGenerator: (id: string) => {
        const state = get();
        const cost = state.getGeneratorCost(id);

        if (state.glyphs.gte(cost)) {
          set((state) => ({
            glyphs: state.glyphs.sub(cost),
            generators: state.generators.map((g) =>
              g.id === id ? { ...g, owned: g.owned + 1 } : g
            ),
          }));
        }
      },

      getGeneratorCost: (id: string) => {
        const generator = get().generators.find((g) => g.id === id);
        if (!generator) return new Decimal(Infinity);
        return generator.baseCost.mul(
          Decimal.pow(generator.costMultiplier, generator.owned)
        );
      },

      getGeneratorProduction: (id: string) => {
        const generator = get().generators.find((g) => g.id === id);
        if (!generator) return new Decimal(0);
        return generator.baseProduction.mul(generator.owned);
      },

      getTotalProduction: () => {
        const state = get();
        return state.generators.reduce((total, g) => {
          return total.add(state.getGeneratorProduction(g.id));
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

        if (state.glyphs.gte(upgrade.cost)) {
          upgrade.effect();
          set((state) => ({
            glyphs: state.glyphs.sub(upgrade.cost),
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
            vocables: state.vocables.add(gain),
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
        return state.glyphs.gte(layer.requirement);
      },

      getPrestigeGain: (layerId: string) => {
        const state = get();
        const layer = state.prestigeLayers.find((l) => l.id === layerId);
        if (!layer) return new Decimal(0);

        // Formula: sqrt(glyphs / requirement)
        return Decimal.floor(
          Decimal.sqrt(state.glyphs.div(layer.requirement))
        );
      },

      // Game loop
      tick: (deltaTime: number) => {
        const state = get();
        const production = state.getTotalProduction();
        const earned = production.mul(deltaTime);

        if (earned.gt(0)) {
          set((state) => ({
            glyphs: state.glyphs.add(earned),
            totalGlyphsEarned: state.totalGlyphsEarned.add(earned),
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
        return production.mul(seconds).mul(0.5);
      },
    }),
    {
      name: "infinite-library-save",
      storage: customStorage,
    }
  )
);
