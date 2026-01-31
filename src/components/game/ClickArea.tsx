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
    <div className="flex flex-col items-center gap-6 p-8">
      {/* Main counter */}
      <div className="text-center">
        <h1 className="text-5xl md:text-7xl font-serif font-bold text-amber-100">
          {formatNumber(glyphs, 0)}
        </h1>
        <p className="text-xl text-amber-200/70 mt-2">📝 Glyphes</p>
        {production.gt(0) && (
          <p className="text-sm text-amber-300/50 mt-1">
            +{formatNumber(production)}/s
          </p>
        )}
      </div>

      {/* Click button */}
      <motion.button
        onClick={handleClick}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="relative w-48 h-48 md:w-64 md:h-64 rounded-full bg-gradient-to-br from-amber-700 to-amber-900 border-4 border-amber-500/50 shadow-2xl flex items-center justify-center cursor-pointer select-none overflow-hidden"
      >
        <span className="text-6xl md:text-8xl">📜</span>

        {/* Floating numbers */}
        {floatingNumbers.map((num) => (
          <motion.span
            key={num.id}
            initial={{ opacity: 1, y: 0, x: num.x - 96, scale: 1 }}
            animate={{ opacity: 0, y: -60, scale: 1.5 }}
            transition={{ duration: 1 }}
            className="absolute text-2xl font-bold text-amber-300 pointer-events-none"
            style={{ left: num.x, top: num.y }}
          >
            +1
          </motion.span>
        ))}
      </motion.button>

      <p className="text-amber-400/60 text-sm">Cliquez pour générer des glyphes</p>
    </div>
  );
}
