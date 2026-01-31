"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import Decimal from "break_infinity.js";
import { GameStore, Generator, UpgradeState, UpgradeDefinition } from "./types";
import { initialGenerators } from "@/data/generators";
import { upgradeDefinitions } from "@/data/upgrades";

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
    if ("__decimal" in (obj as Record<string, unknown>)) {
      return new Decimal((obj as { __decimal: string }).__decimal);
    }
    
    if (Array.isArray(obj)) {
      return obj.map(hydrateDecimals);
    }
    
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

// Initialize upgrade states from definitions
const initialUpgradeStates: UpgradeState[] = upgradeDefinitions.map((def) => ({
  id: def.id,
  purchased: false,
  unlocked: false,
}));

const initialMultipliers = {
  click: 1,
  global: 1,
  generators: {} as Record<string, number>,
  startingGlyphs: 0,
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
  upgradeStates: initialUpgradeStates,
  upgrades: [], // Legacy, kept for backwards compat

  // Multipliers
  multipliers: initialMultipliers,

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
        const clickPower = get().getClickPower();
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
        const state = get();
        const generator = state.generators.find((g) => g.id === id);
        if (!generator || generator.owned === 0) return new Decimal(0);
        
        const baseProduction = ensureDecimal(generator.baseProduction);
        let production = baseProduction.mul(generator.owned);
        
        // Apply generator-specific multiplier
        const genMultiplier = state.multipliers.generators[id] || 1;
        production = production.mul(genMultiplier);
        
        // Apply global multiplier
        production = production.mul(state.multipliers.global);
        
        // Apply synergy multipliers
        const synergyMultiplier = get().calculateSynergyMultiplier();
        production = production.mul(synergyMultiplier);
        
        return production;
      },

      getTotalProduction: () => {
        const state = get();
        return state.generators.reduce((total, g) => {
          return ensureDecimal(total).add(state.getGeneratorProduction(g.id));
        }, new Decimal(0));
      },

      getTotalGenerators: () => {
        const state = get();
        return state.generators.reduce((total, g) => total + g.owned, 0);
      },

      getGeneratorTypesOwned: () => {
        const state = get();
        return state.generators.filter((g) => g.owned > 0).length;
      },

      getClickPower: () => {
        const state = get();
        let power = new Decimal(1);
        power = power.mul(state.multipliers.click);
        return power;
      },

      // Calculate synergy multiplier based on purchased synergy upgrades
      calculateSynergyMultiplier: () => {
        const state = get();
        let multiplier = 1;
        
        for (const upgradeState of state.upgradeStates) {
          if (!upgradeState.purchased) continue;
          
          const def = upgradeDefinitions.find((d) => d.id === upgradeState.id);
          if (!def || def.multiplier.type !== "synergy") continue;
          
          const { synergyType, value } = def.multiplier;
          
          if (synergyType === "totalGenerators") {
            const totalGens = state.getTotalGenerators();
            multiplier *= 1 + totalGens * value;
          } else if (synergyType === "generatorTypes") {
            const genTypes = state.getGeneratorTypesOwned();
            multiplier *= 1 + genTypes * value;
          }
        }
        
        return multiplier;
      },

      // Upgrade actions
      isUpgradeUnlocked: (id: string) => {
        const state = get();
        const def = upgradeDefinitions.find((d) => d.id === id);
        if (!def) return false;
        
        const condition = def.unlockAt;
        
        if (condition.resource === "totalGlyphsEarned") {
          return ensureDecimal(state.totalGlyphsEarned).gte(condition.amount);
        }
        if (condition.resource === "vocables") {
          return ensureDecimal(state.vocables).gte(condition.amount);
        }
        if (condition.resource === "glyphs") {
          return ensureDecimal(state.glyphs).gte(condition.amount);
        }
        if (condition.resource === "generators") {
          const gen = state.generators.find((g) => g.id === condition.generatorId);
          return gen ? gen.owned >= condition.amount : false;
        }
        if (condition.resource === "totalGenerators") {
          return state.getTotalGenerators() >= condition.amount;
        }
        if (condition.resource === "generatorTypes") {
          return state.getGeneratorTypesOwned() >= condition.amount;
        }
        
        return false;
      },

      isUpgradePurchased: (id: string) => {
        const state = get();
        const upgradeState = state.upgradeStates.find((u) => u.id === id);
        return upgradeState?.purchased || false;
      },

      getAvailableUpgrades: () => {
        const state = get();
        return upgradeDefinitions.filter((def) => {
          const isPurchased = state.isUpgradePurchased(def.id);
          const isUnlocked = state.isUpgradeUnlocked(def.id);
          return !isPurchased && isUnlocked;
        });
      },

      buyUpgrade: (id: string) => {
        const state = get();
        const def = upgradeDefinitions.find((d) => d.id === id);
        if (!def) return;
        
        if (state.isUpgradePurchased(id)) return;
        if (!state.isUpgradeUnlocked(id)) return;
        
        // Check currency
        const cost = ensureDecimal(def.cost);
        let canAfford = false;
        
        if (def.currency === "glyphs") {
          canAfford = ensureDecimal(state.glyphs).gte(cost);
        } else if (def.currency === "vocables") {
          canAfford = ensureDecimal(state.vocables).gte(cost);
        } else if (def.currency === "fragments") {
          canAfford = ensureDecimal(state.fragments).gte(cost);
        }
        
        if (!canAfford) return;
        
        // Deduct cost
        if (def.currency === "glyphs") {
          set((s) => ({ glyphs: ensureDecimal(s.glyphs).sub(cost) }));
        } else if (def.currency === "vocables") {
          set((s) => ({ vocables: ensureDecimal(s.vocables).sub(cost) }));
        } else if (def.currency === "fragments") {
          set((s) => ({ fragments: ensureDecimal(s.fragments).sub(cost) }));
        }
        
        // Mark as purchased
        set((s) => ({
          upgradeStates: s.upgradeStates.map((u) =>
            u.id === id ? { ...u, purchased: true, unlocked: true } : u
          ),
        }));
        
        // Recalculate multipliers
        get().recalculateMultipliers();
      },

      recalculateMultipliers: () => {
        const state = get();
        const newMultipliers = {
          click: 1,
          global: 1,
          generators: {} as Record<string, number>,
          startingGlyphs: 0,
        };
        
        for (const upgradeState of state.upgradeStates) {
          if (!upgradeState.purchased) continue;
          
          const def = upgradeDefinitions.find((d) => d.id === upgradeState.id);
          if (!def) continue;
          
          const mult = def.multiplier;
          
          if (mult.type === "click") {
            newMultipliers.click *= mult.value;
          } else if (mult.type === "global") {
            newMultipliers.global *= mult.value;
          } else if (mult.type === "generator") {
            const current = newMultipliers.generators[mult.generatorId] || 1;
            newMultipliers.generators[mult.generatorId] = current * mult.value;
          } else if (mult.type === "startingGlyphs") {
            newMultipliers.startingGlyphs += mult.value;
          }
          // Synergy is calculated dynamically
        }
        
        set({ multipliers: newMultipliers });
      },

      // Prestige actions
      prestige: (layerId: string) => {
        const state = get();
        if (!state.canPrestige(layerId)) return;

        const gain = state.getPrestigeGain(layerId);
        const layer = state.prestigeLayers.find((l) => l.id === layerId);

        if (layer && layer.currency === "vocables") {
          const startingGlyphs = state.multipliers.startingGlyphs;
          
          // Reset generators but keep upgrade states
          const resetGenerators = initialGenerators.map((g) => ({ ...g, owned: 0 }));
          
          set((s) => ({
            vocables: ensureDecimal(s.vocables).add(gain),
            glyphs: new Decimal(startingGlyphs),
            generators: resetGenerators,
            prestigeLayers: s.prestigeLayers.map((l) =>
              l.id === layerId ? { ...l, timesReset: l.timesReset + 1 } : l
            ),
            totalGlyphsEarned: new Decimal(startingGlyphs),
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
        
        return Decimal.floor(Decimal.sqrt(glyphs.div(requirement)));
      },

      // Game loop
      tick: (deltaTime: number) => {
        const state = get();
        const production = state.getTotalProduction();
        const earned = production.mul(deltaTime);

        if (earned.gt(0)) {
          set((s) => ({
            glyphs: ensureDecimal(s.glyphs).add(earned),
            totalGlyphsEarned: ensureDecimal(s.totalGlyphsEarned).add(earned),
            playTime: s.playTime + deltaTime,
          }));
        } else {
          set((s) => ({
            playTime: s.playTime + deltaTime,
          }));
        }
      },

      // Save/Load
      save: () => {
        set({ lastSave: Date.now() });
      },

      load: () => {
        // Handled by persist middleware
        // Recalculate multipliers on load
        get().recalculateMultipliers();
      },

      reset: () => {
        set({
          ...initialState,
          upgradeStates: initialUpgradeStates.map((u) => ({ ...u })),
        });
      },

      // Offline progress
      calculateOfflineProgress: (seconds: number) => {
        const state = get();
        const production = state.getTotalProduction();
        return ensureDecimal(production).mul(seconds).mul(0.5);
      },
    }),
    {
      name: "infinite-library-save",
      storage: customStorage,
      onRehydrateStorage: () => (state) => {
        // Recalculate multipliers after loading from storage
        if (state) {
          state.recalculateMultipliers();
        }
      },
    }
  )
);
