"use client";

import { useGameLoop, useAutoSave } from "@/hooks/useGameLoop";
import { ClickArea } from "./ClickArea";
import { GeneratorList } from "./GeneratorList";

export function Game() {
  // Start game loop and auto-save
  useGameLoop();
  useAutoSave();

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-950 via-stone-900 to-stone-950 text-amber-50">
      {/* Header */}
      <header className="border-b border-amber-900/30 p-4">
        <h1 className="text-2xl font-serif text-center text-amber-200">
          📚 La Bibliothèque Infinie
        </h1>
      </header>

      {/* Main game area */}
      <main className="container mx-auto max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
          {/* Left: Click area */}
          <div className="flex items-center justify-center min-h-[400px] bg-stone-900/30 rounded-xl border border-amber-900/20">
            <ClickArea />
          </div>

          {/* Right: Generators */}
          <div className="bg-stone-900/30 rounded-xl border border-amber-900/20 max-h-[600px] overflow-y-auto">
            <GeneratorList />
          </div>
        </div>

        {/* Stats bar */}
        <div className="mx-4 mb-4 p-4 bg-stone-900/30 rounded-xl border border-amber-900/20">
          <div className="flex flex-wrap justify-center gap-6 text-sm text-amber-200/60">
            <span>Cliquez pour commencer votre voyage dans la bibliothèque...</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center p-4 text-amber-200/30 text-xs">
        Inspiré par "La Bibliothèque de Babel" de Jorge Luis Borges
      </footer>
    </div>
  );
}
