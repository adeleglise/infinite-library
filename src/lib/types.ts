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
  glyphs: Decimal; // Base currency (letters)
  vocables: Decimal; // First prestige currency (words)
  fragments: Decimal; // Second prestige currency (sentences)
  codex: Decimal; // Third prestige currency (books)

  // Generators
  generators: Generator[];

  // Upgrades
  upgrades: Upgrade[];

  // Prestige
  prestigeLayers: PrestigeLayer[];

  // Stats
  totalGlyphsEarned: Decimal;
  totalClicks: number;
  playTime: number; // in seconds
  lastSave: number; // timestamp

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
  getClickPower: () => Decimal;

  // Upgrade actions
  buyUpgrade: (id: string) => void;

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
