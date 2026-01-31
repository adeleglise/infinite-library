"use client";

import { useState } from "react";
import { useGameLoop, useAutoSave } from "@/hooks/useGameLoop";
import { useGameStore } from "@/lib/gameStore";
import { ClickArea } from "./ClickArea";
import { GeneratorList } from "./GeneratorList";
import { PixelLibrary } from "./PixelLibrary";
import { NotesPanel } from "../notes/NotesPanel";
import Decimal from "break_infinity.js";

type Tab = "game" | "notes";

export function Game() {
  const [activeTab, setActiveTab] = useState<Tab>("game");
  const { addGlyphs } = useGameStore();

  // Start game loop and auto-save
  useGameLoop();
  useAutoSave();

  // Handle glyphs earned from notes
  const handleNotesGlyphs = (glyphs: number) => {
    addGlyphs(new Decimal(glyphs));
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header with tabs */}
      <header className="border-b border-amber-700/30 bg-amber-50/50 backdrop-blur-sm">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-2xl font-serif text-amber-900">
            📚 La Bibliothèque Infinie
          </h1>
          
          {/* Tabs */}
          <div className="flex gap-1 bg-amber-200/50 rounded-lg p-1">
            <button
              onClick={() => setActiveTab("game")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "game"
                  ? "bg-white text-amber-900 shadow-sm"
                  : "text-amber-700 hover:text-amber-900"
              }`}
            >
              🎮 Jeu
            </button>
            <button
              onClick={() => setActiveTab("notes")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "notes"
                  ? "bg-white text-amber-900 shadow-sm"
                  : "text-amber-700 hover:text-amber-900"
              }`}
            >
              📝 Notes
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 container mx-auto max-w-6xl">
        {activeTab === "game" ? (
          <>
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
          </>
        ) : (
          <div className="h-[calc(100vh-120px)] bg-amber-100/60 m-4 rounded-xl border border-amber-300/50 shadow-inner overflow-hidden">
            <NotesPanel onGlyphsEarned={handleNotesGlyphs} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center p-4 text-amber-700/40 text-xs">
        Inspiré par "La Bibliothèque de Babel" de Jorge Luis Borges
      </footer>
    </div>
  );
}
