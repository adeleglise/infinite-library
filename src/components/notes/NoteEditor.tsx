"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import type { Note } from "@/lib/s3";

interface NoteEditorProps {
  note: Note | null;
  isNew: boolean;
  onSave: (note: { title: string; content: string; tags: string[] }) => Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
}

export function NoteEditor({ note, isNew, onSave, onCancel, isSaving }: NoteEditorProps) {
  const [title, setTitle] = useState(note?.title || "");
  const [content, setContent] = useState(note?.content || "");
  const [tagsInput, setTagsInput] = useState(note?.tags.join(", ") || "");
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setTagsInput(note.tags.join(", "));
    } else {
      setTitle("");
      setContent("");
      setTagsInput("");
    }
  }, [note]);

  const handleSave = async () => {
    if (!title.trim()) return;
    
    const tags = tagsInput
      .split(",")
      .map(t => t.trim().toLowerCase())
      .filter(t => t.length > 0);
    
    await onSave({ title: title.trim(), content, tags });
  };

  // Simple markdown to HTML converter
  const renderMarkdown = (md: string) => {
    let html = md
      // Headers
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mt-4 mb-2">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-4 mb-2">$1</h1>')
      // Bold
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Code blocks
      .replace(/```([\s\S]*?)```/g, '<pre class="bg-amber-100 p-2 rounded my-2 text-sm overflow-x-auto"><code>$1</code></pre>')
      // Inline code
      .replace(/`(.*?)`/g, '<code class="bg-amber-100 px-1 rounded text-sm">$1</code>')
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-amber-700 underline" target="_blank">$1</a>')
      // Lists
      .replace(/^\- (.*$)/gim, '<li class="ml-4">• $1</li>')
      // Line breaks
      .replace(/\n/g, '<br>');
    
    return html;
  };

  const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;
  const charCount = content.length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b border-amber-300/50 flex items-center justify-between">
        <h2 className="font-serif font-semibold text-amber-900">
          {isNew ? "Nouvelle note" : "Modifier la note"}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className={`px-3 py-1 text-xs rounded transition-colors ${
              showPreview
                ? "bg-amber-600 text-white"
                : "bg-amber-200/50 text-amber-800 hover:bg-amber-300/50"
            }`}
          >
            {showPreview ? "Éditer" : "Aperçu"}
          </button>
        </div>
      </div>

      {/* Title input */}
      <div className="p-3 border-b border-amber-200/30">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Titre de la note..."
          className="w-full bg-transparent text-xl font-serif font-semibold text-amber-900 placeholder-amber-400/50 focus:outline-none"
        />
      </div>

      {/* Tags input */}
      <div className="px-3 py-2 border-b border-amber-200/30">
        <input
          type="text"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          placeholder="Tags (séparés par des virgules)..."
          className="w-full bg-transparent text-sm text-amber-700 placeholder-amber-400/50 focus:outline-none"
        />
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-hidden">
        {showPreview ? (
          <div 
            className="h-full p-4 overflow-y-auto prose prose-amber max-w-none"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
          />
        ) : (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Écrivez votre note en markdown..."
            className="w-full h-full p-4 bg-transparent text-amber-900 placeholder-amber-400/50 focus:outline-none resize-none font-mono text-sm"
          />
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-amber-300/50 flex items-center justify-between">
        <div className="text-xs text-amber-600/60">
          {wordCount} mots · {charCount} caractères
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-amber-700 hover:text-amber-900 transition-colors"
          >
            Annuler
          </button>
          <motion.button
            onClick={handleSave}
            disabled={!title.trim() || isSaving}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-4 py-2 text-sm bg-amber-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-amber-700 transition-colors"
          >
            {isSaving ? "Enregistrement..." : "Enregistrer"}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
