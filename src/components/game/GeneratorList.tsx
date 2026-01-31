"use client";

import { useGameStore } from "@/lib/gameStore";
import { formatNumber } from "@/lib/formatNumber";
import { motion } from "framer-motion";
import { useMemo } from "react";
import Decimal from "break_infinity.js";

// Helper to ensure value is Decimal
function ensureDecimal(value: unknown): Decimal {
  if (value instanceof Decimal) return value;
  if (typeof value === "number" || typeof value === "string") {
    return new Decimal(value);
  }
  return new Decimal(0);
}

export function GeneratorList() {
  const { generators, glyphs, buyGenerator, getGeneratorCost, getGeneratorProduction } =
    useGameStore();
  
  const safeGlyphs = useMemo(() => ensureDecimal(glyphs), [glyphs]);
  const visibleGenerators = generators.filter((g) => g.unlocked);

  return (
    <div className="flex flex-col gap-2 p-4">
      <h2 className="text-lg font-serif text-amber-900 border-b border-amber-400/50 pb-2">
        Générateurs
      </h2>

      {visibleGenerators.map((generator) => {
        const cost = ensureDecimal(getGeneratorCost(generator.id));
        const production = ensureDecimal(getGeneratorProduction(generator.id));
        const canAfford = safeGlyphs.gte(cost);

        return (
          <motion.button
            key={generator.id}
            onClick={() => buyGenerator(generator.id)}
            disabled={!canAfford}
            whileHover={canAfford ? { scale: 1.01 } : {}}
            whileTap={canAfford ? { scale: 0.99 } : {}}
            className={`
              flex items-center gap-3 p-3 rounded-lg border transition-all text-left
              ${
                canAfford
                  ? "bg-amber-50 border-amber-400/60 hover:bg-amber-100 hover:border-amber-500 cursor-pointer shadow-sm"
                  : "bg-stone-100/50 border-stone-300/50 cursor-not-allowed opacity-50"
              }
            `}
          >
            {/* Icon */}
            <span className="text-2xl">{generator.icon}</span>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="font-serif font-semibold text-amber-900 truncate">
                  {generator.name}
                </span>
                <span className="text-amber-700 font-mono text-sm shrink-0">
                  x{generator.owned}
                </span>
              </div>
              <p className="text-xs text-amber-600/60 mt-0.5 truncate">{generator.description}</p>
              {generator.owned > 0 && (
                <p className="text-xs text-green-700/80 mt-0.5">
                  +{formatNumber(production)}/s
                </p>
              )}
            </div>

            {/* Cost */}
            <div className="text-right shrink-0">
              <p
                className={`font-mono text-sm ${
                  canAfford ? "text-amber-800" : "text-red-500/70"
                }`}
              >
                {formatNumber(cost)}
              </p>
              <p className="text-xs text-amber-500/60">📝</p>
            </div>
          </motion.button>
        );
      })}

      {visibleGenerators.length === 0 && (
        <p className="text-amber-600/40 text-center py-8">
          Aucun générateur disponible
        </p>
      )}
    </div>
  );
}
