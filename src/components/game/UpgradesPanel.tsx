"use client";

import { useGameStore } from "@/lib/gameStore";
import { upgradeDefinitions } from "@/data/upgrades";
import { formatNumber } from "@/lib/formatNumber";
import { motion, AnimatePresence } from "framer-motion";
import Decimal from "break_infinity.js";

function ensureDecimal(value: unknown): Decimal {
  if (value instanceof Decimal) return value;
  if (typeof value === "number" || typeof value === "string") {
    return new Decimal(value);
  }
  return new Decimal(0);
}

export function UpgradesPanel() {
  const {
    glyphs,
    vocables,
    buyUpgrade,
    isUpgradeUnlocked,
    isUpgradePurchased,
  } = useGameStore();

  // Get all unlocked, unpurchased upgrades
  const availableUpgrades = upgradeDefinitions.filter(
    (def) => isUpgradeUnlocked(def.id) && !isUpgradePurchased(def.id)
  );

  // Get purchased upgrades for display
  const purchasedUpgrades = upgradeDefinitions.filter((def) =>
    isUpgradePurchased(def.id)
  );

  const canAfford = (def: typeof upgradeDefinitions[0]) => {
    const cost = ensureDecimal(def.cost);
    if (def.currency === "glyphs") {
      return ensureDecimal(glyphs).gte(cost);
    } else if (def.currency === "vocables") {
      return ensureDecimal(vocables).gte(cost);
    }
    return false;
  };

  const getCurrencyIcon = (currency: string) => {
    switch (currency) {
      case "glyphs":
        return "✒️";
      case "vocables":
        return "📖";
      case "fragments":
        return "📜";
      default:
        return "💰";
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "click":
        return "Clic";
      case "generator":
        return "Générateurs";
      case "global":
        return "Global";
      case "synergy":
        return "Synergie";
      case "prestige":
        return "Prestige";
      default:
        return category;
    }
  };

  if (availableUpgrades.length === 0 && purchasedUpgrades.length === 0) {
    return (
      <div className="bg-amber-50/80 rounded-lg p-4 border border-amber-200">
        <h3 className="text-lg font-serif font-bold text-amber-900 mb-2">
          📜 Améliorations
        </h3>
        <p className="text-amber-700 text-sm italic">
          Continuez à générer des glyphes pour débloquer des améliorations...
        </p>
      </div>
    );
  }

  return (
    <div className="bg-amber-50/80 rounded-lg p-4 border border-amber-200">
      <h3 className="text-lg font-serif font-bold text-amber-900 mb-3">
        📜 Améliorations
      </h3>

      {/* Available upgrades */}
      {availableUpgrades.length > 0 && (
        <div className="space-y-2 mb-4">
          <AnimatePresence>
            {availableUpgrades.map((def) => (
              <motion.button
                key={def.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onClick={() => buyUpgrade(def.id)}
                disabled={!canAfford(def)}
                className={`
                  w-full text-left p-3 rounded-lg border transition-all
                  ${
                    canAfford(def)
                      ? "bg-amber-100 border-amber-400 hover:bg-amber-200 hover:border-amber-500 cursor-pointer"
                      : "bg-gray-100 border-gray-300 opacity-60 cursor-not-allowed"
                  }
                `}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{def.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-serif font-semibold text-amber-900">
                        {def.name}
                      </span>
                      <span className="text-xs px-1.5 py-0.5 bg-amber-200/50 rounded text-amber-700">
                        {getCategoryLabel(def.category)}
                      </span>
                    </div>
                    <p className="text-sm text-amber-700 mt-0.5">
                      {def.description}
                    </p>
                    <div className="flex items-center gap-1 mt-1 text-sm">
                      <span className={canAfford(def) ? "text-green-700" : "text-red-700"}>
                        {getCurrencyIcon(def.currency)}{" "}
                        {formatNumber(ensureDecimal(def.cost))}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Purchased upgrades */}
      {purchasedUpgrades.length > 0 && (
        <div className="border-t border-amber-200 pt-3 mt-3">
          <h4 className="text-sm font-semibold text-amber-800 mb-2">
            ✅ Acquises ({purchasedUpgrades.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {purchasedUpgrades.map((def) => (
              <div
                key={def.id}
                title={`${def.name}: ${def.description}`}
                className="w-8 h-8 flex items-center justify-center bg-amber-200/50 rounded border border-amber-300 text-lg cursor-help"
              >
                {def.icon}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
