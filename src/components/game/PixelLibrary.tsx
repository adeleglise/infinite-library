"use client";

import { useGameStore } from "@/lib/gameStore";
import { useMemo } from "react";
import Decimal from "break_infinity.js";

// Pixel art library that fills up as you progress
export function PixelLibrary() {
  const { generators, totalGlyphsEarned } = useGameStore();

  // Calculate total books owned (based on generators)
  const totalBooks = useMemo(() => {
    return generators.reduce((sum, g) => sum + g.owned, 0);
  }, [generators]);

  // Calculate fill percentage (max 100 books for full library)
  const fillPercentage = Math.min(totalBooks / 50, 1);

  // Calculate which shelves are filled (5 shelves)
  const filledShelves = Math.ceil(fillPercentage * 5);

  // Book colors for variety
  const bookColors = [
    "bg-red-700",
    "bg-amber-800",
    "bg-green-800",
    "bg-blue-800",
    "bg-purple-800",
    "bg-red-900",
    "bg-amber-700",
    "bg-emerald-900",
    "bg-indigo-900",
    "bg-rose-800",
  ];

  // Generate books for a shelf
  const generateBooks = (shelfIndex: number, maxBooks: number) => {
    const booksOnShelf = Math.min(
      Math.floor((totalBooks - shelfIndex * 10) / 1) + 1,
      maxBooks
    );
    const actualBooks = Math.max(0, Math.min(booksOnShelf, maxBooks));

    return Array.from({ length: maxBooks }).map((_, i) => {
      const isVisible = i < actualBooks;
      const height = 20 + (i % 3) * 4; // Varying heights
      const colorIndex = (shelfIndex * 3 + i) % bookColors.length;

      return (
        <div
          key={i}
          className={`
            transition-all duration-500 ease-out
            ${isVisible ? bookColors[colorIndex] : "bg-transparent"}
            ${isVisible ? "opacity-100" : "opacity-0"}
          `}
          style={{
            width: "6px",
            height: isVisible ? `${height}px` : "0px",
            marginRight: "1px",
            borderRadius: "1px 1px 0 0",
            boxShadow: isVisible ? "inset -1px 0 0 rgba(0,0,0,0.3)" : "none",
          }}
        />
      );
    });
  };

  return (
    <div className="flex flex-col items-center">
      {/* Library frame */}
      <div
        className="relative bg-amber-900 rounded-t-lg p-2 shadow-lg"
        style={{
          width: "280px",
          imageRendering: "pixelated",
        }}
      >
        {/* Top decorative piece */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-20 h-3 bg-amber-800 rounded-t-lg" />

        {/* Shelves container */}
        <div className="bg-amber-950/50 p-2 rounded">
          {/* 5 Shelves */}
          {[0, 1, 2, 3, 4].map((shelfIndex) => (
            <div key={shelfIndex} className="mb-1">
              {/* Books on shelf */}
              <div
                className="flex items-end justify-start h-7 px-1"
                style={{ minHeight: "28px" }}
              >
                {generateBooks(shelfIndex, 12)}
              </div>
              {/* Shelf wood */}
              <div className="h-2 bg-amber-700 rounded-sm shadow-md" />
            </div>
          ))}
        </div>

        {/* Side decorations */}
        <div className="absolute left-0 top-0 bottom-0 w-2 bg-amber-800 rounded-l-lg" />
        <div className="absolute right-0 top-0 bottom-0 w-2 bg-amber-800 rounded-r-lg" />
      </div>

      {/* Base */}
      <div className="w-72 h-3 bg-amber-800 rounded-b-lg shadow-lg" />

      {/* Stats */}
      <div className="mt-3 text-center">
        <p className="text-amber-800 font-serif text-sm">
          📚 {totalBooks} livres collectés
        </p>
        {totalGlyphsEarned.gt(0) && (
          <p className="text-amber-600/60 text-xs mt-1">
            {totalGlyphsEarned.gt(new Decimal(1e6))
              ? totalGlyphsEarned.toExponential(1)
              : totalGlyphsEarned.toFixed(0)}{" "}
            glyphes générés au total
          </p>
        )}
      </div>
    </div>
  );
}
