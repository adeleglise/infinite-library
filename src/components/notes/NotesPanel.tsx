"use client";

import { useState, useEffect, useCallback } from "react";
import { NotesList } from "./NotesList";
import { NoteEditor } from "./NoteEditor";
import type { Note, NoteMeta, NotesIndex } from "@/lib/s3";

interface NotesPanelProps {
  onGlyphsEarned?: (glyphs: number) => void;
}

export function NotesPanel({ onGlyphsEarned }: NotesPanelProps) {
  const [notes, setNotes] = useState<NoteMeta[]>([]);
  const [gameState, setGameState] = useState<NotesIndex["gameState"] | null>(null);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch notes from API (via local proxy to avoid CORS/auth issues)
  const fetchNotes = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/notes-proxy");
      if (!response.ok) throw new Error("Failed to fetch notes");
      const data = await response.json();
      setNotes(data.notes || []);
      setGameState(data.gameState || null);
    } catch (err) {
      console.error("Error fetching notes:", err);
      setError("Impossible de charger les notes");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load notes on mount
  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  // Fetch selected note content
  useEffect(() => {
    if (!selectedNoteId) {
      setSelectedNote(null);
      return;
    }

    const fetchNote = async () => {
      try {
        const response = await fetch(`/api/notes-proxy?id=${selectedNoteId}`);
        if (!response.ok) throw new Error("Failed to fetch note");
        const note = await response.json();
        setSelectedNote(note);
      } catch (err) {
        console.error("Error fetching note:", err);
        setSelectedNote(null);
      }
    };

    fetchNote();
  }, [selectedNoteId]);

  // Filter notes by tag
  const filteredNotes = activeTag
    ? notes.filter(n => n.tags.includes(activeTag))
    : notes;

  // Save note (create or update)
  const handleSave = async (noteData: { title: string; content: string; tags: string[] }) => {
    setIsSaving(true);
    try {
      const isUpdate = selectedNoteId && !isCreating;
      const url = isUpdate ? `/api/notes-proxy?id=${selectedNoteId}` : "/api/notes-proxy";
      const method = isUpdate ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(noteData),
      });

      if (!response.ok) throw new Error("Failed to save note");

      const result = await response.json();
      
      // Notify about glyphs earned
      if (result.glyphsEarned && onGlyphsEarned) {
        onGlyphsEarned(result.glyphsEarned);
      }

      // Refresh notes list
      await fetchNotes();
      
      // Select the new/updated note
      if (result.note?.id) {
        setSelectedNoteId(result.note.id);
      }
      
      setIsCreating(false);
    } catch (err) {
      console.error("Error saving note:", err);
      setError("Erreur lors de la sauvegarde");
    } finally {
      setIsSaving(false);
    }
  };

  // Cancel editing
  const handleCancel = () => {
    setIsCreating(false);
    if (!selectedNoteId) {
      setSelectedNote(null);
    }
  };

  // Delete note
  const handleDelete = async () => {
    if (!selectedNoteId || !confirm("Supprimer cette note ?")) return;

    try {
      const response = await fetch(`/api/notes-proxy?id=${selectedNoteId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete note");

      setSelectedNoteId(null);
      setSelectedNote(null);
      await fetchNotes();
    } catch (err) {
      console.error("Error deleting note:", err);
      setError("Erreur lors de la suppression");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-amber-600/60">
        Chargement des notes...
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Left: Notes list */}
      <div className="w-1/3 min-w-[200px] max-w-[300px] border-r border-amber-300/50 flex flex-col">
        {/* Header with create button */}
        <div className="p-3 border-b border-amber-300/50 flex items-center justify-between">
          <h2 className="font-serif font-semibold text-amber-900">
            📚 Notes
          </h2>
          <button
            onClick={() => {
              setIsCreating(true);
              setSelectedNoteId(null);
              setSelectedNote(null);
            }}
            className="px-2 py-1 text-xs bg-amber-600 text-white rounded hover:bg-amber-700 transition-colors"
          >
            + Nouvelle
          </button>
        </div>

        {/* Stats */}
        {gameState && (
          <div className="px-3 py-2 border-b border-amber-200/30 text-xs text-amber-600/70 flex items-center gap-3">
            <span>📝 {gameState.notesCreated} notes</span>
            <span>🔥 {gameState.streakDays}j streak</span>
          </div>
        )}

        {/* Notes list */}
        <div className="flex-1 overflow-hidden">
          <NotesList
            notes={filteredNotes}
            selectedId={selectedNoteId}
            onSelect={(id) => {
              setSelectedNoteId(id);
              setIsCreating(false);
            }}
            onTagFilter={setActiveTag}
            activeTag={activeTag}
          />
        </div>
      </div>

      {/* Right: Editor or empty state */}
      <div className="flex-1 flex flex-col">
        {isCreating || selectedNote ? (
          <>
            <NoteEditor
              note={isCreating ? null : selectedNote}
              isNew={isCreating}
              onSave={handleSave}
              onCancel={handleCancel}
              isSaving={isSaving}
            />
            {selectedNote && !isCreating && (
              <div className="p-2 border-t border-amber-200/30 flex justify-end">
                <button
                  onClick={handleDelete}
                  className="px-3 py-1 text-xs text-red-600 hover:text-red-800 transition-colors"
                >
                  Supprimer
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-amber-600/40">
            <div className="text-center">
              <p className="text-4xl mb-2">📖</p>
              <p>Sélectionnez une note ou créez-en une nouvelle</p>
            </div>
          </div>
        )}
      </div>

      {/* Error toast */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg">
          {error}
          <button onClick={() => setError(null)} className="ml-2">×</button>
        </div>
      )}
    </div>
  );
}
