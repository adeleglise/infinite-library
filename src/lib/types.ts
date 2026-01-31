import Decimal from "break_infinity.js";

export interface Generator {
  id: string;
  name: string;
  description: string;
  baseCost: Decimal;
  baseProduction: Decimal;
  costMultiplier: number;
  owned: number;
  unlocked: boolean;
  icon: string;
}

// Multiplier types for upgrades
export type MultiplierType =
  | { type: "click"; value: number }
  | { type: "generator"; generatorId: string; value: number }
  | { type: "global"; value: number }
  | { type: "synergy"; synergyType: "totalGenerators" | "generatorTypes"; value: number }
  | { type: "startingGlyphs"; value: number };

// Unlock conditions
export type UnlockCondition =
  | { resource: "totalGlyphsEarned" | "vocables" | "glyphs"; amount: Decimal }
  | { resource: "generators"; generatorId: string; amount: number }
  | { resource: "totalGenerators" | "generatorTypes"; amount: number };

// Upgrade definition (static data)
export interface UpgradeDefinition {
  id: string;
  name: string;
  description: string;
  cost: Decimal;
  currency: "glyphs" | "vocables" | "fragments";
  category: "click" | "generator" | "global" | "synergy" | "prestige";
  icon: string;
  multiplier: MultiplierType;
  unlockAt: UnlockCondition;
}

// Runtime upgrade state
export interface UpgradeState {
  id: string;
  purchased: boolean;
  unlocked: boolean;
}

// Legacy Upgrade interface (for backwards compat)
export interface Upgrade {
  id: string;
  name: string;
  description: string;
  cost: Decimal;
  effect: () => void;
  purchased: boolean;
  unlocked: boolean;
  requirement?: () => boolean;
}

export interface PrestigeLayer {
  id: string;
  name: string;
  currency: string;
  currencyIcon: string;
  multiplier: Decimal;
  requirement: Decimal;
  timesReset: number;
}

export interface GameState {
  // Resources
  glyphs: Decimal;
  vocables: Decimal;
  fragments: Decimal;
  codex: Decimal;

  // Generators
  generators: Generator[];

  // Upgrades (runtime state)
  upgradeStates: UpgradeState[];

  // Legacy upgrades (kept for backwards compat)
  upgrades: Upgrade[];

  // Prestige
  prestigeLayers: PrestigeLayer[];

  // Multipliers (computed from upgrades)
  multipliers: {
    click: number;
    global: number;
    generators: Record<string, number>;
    startingGlyphs: number;
  };

  // Stats
  totalGlyphsEarned: Decimal;
  totalClicks: number;
  playTime: number;
  lastSave: number;

  // Settings
  notation: "scientific" | "engineering" | "letters";
}

export interface GameActions {
  // Core actions
  addGlyphs: (amount: Decimal) => void;
  click: () => void;

  // Generator actions
  buyGenerator: (id: string) => void;
  getGeneratorCost: (id: string) => Decimal;
  getGeneratorProduction: (id: string) => Decimal;
  getTotalProduction: () => Decimal;
  getTotalGenerators: () => number;
  getGeneratorTypesOwned: () => number;
  getClickPower: () => Decimal;
  calculateSynergyMultiplier: () => number;

  // Upgrade actions
  buyUpgrade: (id: string) => void;
  isUpgradeUnlocked: (id: string) => boolean;
  isUpgradePurchased: (id: string) => boolean;
  getAvailableUpgrades: () => UpgradeDefinition[];
  recalculateMultipliers: () => void;

  // Prestige actions
  prestige: (layerId: string) => void;
  canPrestige: (layerId: string) => boolean;
  getPrestigeGain: (layerId: string) => Decimal;

  // Game loop
  tick: (deltaTime: number) => void;

  // Save/Load
  save: () => void;
  load: () => void;
  reset: () => void;

  // Offline progress
  calculateOfflineProgress: (seconds: number) => Decimal;
}

export type GameStore = GameState & GameActions;
