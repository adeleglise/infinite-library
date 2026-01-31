"use client";

import { useGameStore } from "@/lib/gameStore";
import { formatNumber } from "@/lib/formatNumber";
import { motion } from "framer-motion";
import { useState } from "react";

interface FloatingNumber {
  id: number;
  x: number;
  y: number;
}

export function ClickArea() {
  const { glyphs, click, getTotalProduction } = useGameStore();
  const [floatingNumbers, setFloatingNumbers] = useState<FloatingNumber[]>([]);
  const production = getTotalProduction();

  const handleClick = (e: React.MouseEvent) => {
    click();

    // Add floating +1
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const id = Date.now();
    setFloatingNumbers((prev) => [...prev, { id, x, y }]);

    setTimeout(() => {
      setFloatingNumbers((prev) => prev.filter((n) => n.id !== id));
    }, 1000);
  };

  return (
    <div className="flex flex-col items-center gap-4 p-6">
      {/* Main counter */}
      <div className="text-center">
        <h1 className="text-4xl md:text-6xl font-serif font-bold text-amber-900">
          {formatNumber(glyphs, 0)}
        </h1>
        <p className="text-lg text-amber-700/70 mt-1">📝 Glyphes</p>
        {production.gt(0) && (
          <p className="text-sm text-green-700/70 mt-1">
            +{formatNumber(production)}/s
          </p>
        )}
      </div>

      {/* Click button */}
      <motion.button
        onClick={handleClick}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="relative w-36 h-36 md:w-44 md:h-44 rounded-full bg-gradient-to-br from-amber-200 to-amber-400 border-4 border-amber-500/50 shadow-xl flex items-center justify-center cursor-pointer select-none overflow-hidden hover:shadow-2xl transition-shadow"
      >
        <span className="text-5xl md:text-6xl">📜</span>

        {/* Floating numbers */}
        {floatingNumbers.map((num) => (
          <motion.span
            key={num.id}
            initial={{ opacity: 1, y: 0, scale: 1 }}
            animate={{ opacity: 0, y: -50, scale: 1.5 }}
            transition={{ duration: 0.8 }}
            className="absolute text-xl font-bold text-amber-800 pointer-events-none"
            style={{ left: num.x - 10, top: num.y - 10 }}
          >
            +1
          </motion.span>
        ))}
      </motion.button>

      <p className="text-amber-600/60 text-xs">Cliquez pour générer des glyphes</p>
    </div>
  );
}
