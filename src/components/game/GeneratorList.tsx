"use client";

import { useGameStore } from "@/lib/gameStore";
import { formatNumber } from "@/lib/formatNumber";
import { motion } from "framer-motion";

export function GeneratorList() {
  const { generators, glyphs, buyGenerator, getGeneratorCost, getGeneratorProduction } =
    useGameStore();

  const visibleGenerators = generators.filter((g) => g.unlocked);

  return (
    <div className="flex flex-col gap-3 p-4">
      <h2 className="text-xl font-serif text-amber-200 border-b border-amber-700/50 pb-2">
        Générateurs
      </h2>

      {visibleGenerators.map((generator) => {
        const cost = getGeneratorCost(generator.id);
        const production = getGeneratorProduction(generator.id);
        const canAfford = glyphs.gte(cost);

        return (
          <motion.button
            key={generator.id}
            onClick={() => buyGenerator(generator.id)}
            disabled={!canAfford}
            whileHover={canAfford ? { scale: 1.02 } : {}}
            whileTap={canAfford ? { scale: 0.98 } : {}}
            className={`
              flex items-center gap-4 p-4 rounded-lg border transition-all
              ${
                canAfford
                  ? "bg-amber-900/40 border-amber-600/50 hover:bg-amber-800/50 cursor-pointer"
                  : "bg-stone-900/40 border-stone-700/30 cursor-not-allowed opacity-60"
              }
            `}
          >
            {/* Icon */}
            <span className="text-3xl">{generator.icon}</span>

            {/* Info */}
            <div className="flex-1 text-left">
              <div className="flex items-center justify-between">
                <span className="font-serif font-semibold text-amber-100">
                  {generator.name}
                </span>
                <span className="text-amber-300 font-mono text-sm">
                  x{generator.owned}
                </span>
              </div>
              <p className="text-xs text-amber-200/50 mt-1">{generator.description}</p>
              {generator.owned > 0 && (
                <p className="text-xs text-green-400/70 mt-1">
                  +{formatNumber(production)}/s
                </p>
              )}
            </div>

            {/* Cost */}
            <div className="text-right">
              <p
                className={`font-mono text-sm ${
                  canAfford ? "text-amber-300" : "text-red-400/70"
                }`}
              >
                {formatNumber(cost)}
              </p>
              <p className="text-xs text-amber-200/40">📝</p>
            </div>
          </motion.button>
        );
      })}

      {visibleGenerators.length === 0 && (
        <p className="text-amber-200/40 text-center py-8">
          Aucun générateur disponible
        </p>
      )}
    </div>
  );
}
