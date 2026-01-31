"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import type { NoteMeta } from "@/lib/s3";

interface NotesListProps {
  notes: NoteMeta[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onTagFilter: (tag: string | null) => void;
  activeTag: string | null;
}

export function NotesList({ notes, selectedId, onSelect, onTagFilter, activeTag }: NotesListProps) {
  // Get all unique tags
  const allTags = Array.from(new Set(notes.flatMap(n => n.tags))).sort();

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return "Hier";
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Tags filter */}
      <div className="p-3 border-b border-amber-300/50">
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => onTagFilter(null)}
            className={`px-2 py-1 text-xs rounded-full transition-colors ${
              activeTag === null
                ? "bg-amber-600 text-white"
                : "bg-amber-200/50 text-amber-800 hover:bg-amber-300/50"
            }`}
          >
            Tous
          </button>
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => onTagFilter(tag)}
              className={`px-2 py-1 text-xs rounded-full transition-colors ${
                activeTag === tag
                  ? "bg-amber-600 text-white"
                  : "bg-amber-200/50 text-amber-800 hover:bg-amber-300/50"
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>

      {/* Notes list */}
      <div className="flex-1 overflow-y-auto">
        {notes.length === 0 ? (
          <div className="p-4 text-center text-amber-600/60">
            <p>Aucune note</p>
            <p className="text-xs mt-1">Créez votre première note !</p>
          </div>
        ) : (
          <div className="divide-y divide-amber-200/30">
            {notes.map(note => (
              <motion.button
                key={note.id}
                onClick={() => onSelect(note.id)}
                whileHover={{ backgroundColor: "rgba(251, 191, 36, 0.1)" }}
                className={`w-full text-left p-3 transition-colors ${
                  selectedId === note.id ? "bg-amber-200/40" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-serif font-semibold text-amber-900 truncate">
                    {note.title}
                  </h3>
                  <span className="text-xs text-amber-500 shrink-0">
                    +{note.glyphsEarned}📝
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-amber-600/60">
                    {formatDate(note.updatedAt)}
                  </span>
                  <span className="text-xs text-amber-600/40">
                    {note.wordCount} mots
                  </span>
                </div>
                {note.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {note.tags.slice(0, 3).map(tag => (
                      <span
                        key={tag}
                        className="px-1.5 py-0.5 text-[10px] bg-amber-100 text-amber-700 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                    {note.tags.length > 3 && (
                      <span className="text-[10px] text-amber-500">
                        +{note.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
