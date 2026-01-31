"use client";

import { useGameLoop, useAutoSave } from "@/hooks/useGameLoop";
import { ClickArea } from "./ClickArea";
import { GeneratorList } from "./GeneratorList";
import { PixelLibrary } from "./PixelLibrary";

export function Game() {
  // Start game loop and auto-save
  useGameLoop();
  useAutoSave();

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-amber-700/30 p-4 bg-amber-50/50 backdrop-blur-sm">
        <h1 className="text-2xl font-serif text-center text-amber-900">
          📚 La Bibliothèque Infinie
        </h1>
      </header>

      {/* Main game area */}
      <main className="container mx-auto max-w-6xl">
        {/* Pixel Library Display */}
        <div className="p-4">
          <PixelLibrary />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 pt-0">
          {/* Left: Click area */}
          <div className="flex items-center justify-center min-h-[350px] bg-amber-100/60 rounded-xl border border-amber-300/50 shadow-inner">
            <ClickArea />
          </div>

          {/* Right: Generators */}
          <div className="bg-amber-100/60 rounded-xl border border-amber-300/50 shadow-inner max-h-[500px] overflow-y-auto">
            <GeneratorList />
          </div>
        </div>

        {/* Stats bar */}
        <div className="mx-4 mb-4 p-4 bg-amber-100/60 rounded-xl border border-amber-300/50">
          <div className="flex flex-wrap justify-center gap-6 text-sm text-amber-700/70">
            <span>Cliquez pour commencer votre voyage dans la bibliothèque...</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center p-4 text-amber-700/40 text-xs">
        Inspiré par "La Bibliothèque de Babel" de Jorge Luis Borges
      </footer>
    </div>
  );
}
