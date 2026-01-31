import { NextRequest } from "next/server";
import { 
  getNotesIndex, 
  saveNotesIndex, 
  saveNoteContent, 
  getNoteContent,
  deleteNoteContent,
  calculateNoteGlyphs,
  updateStreak,
  type Note,
  type NoteMeta 
} from "@/lib/s3";
import { randomUUID } from "crypto";

// This is an internal proxy that doesn't require auth
// It's used by the frontend to access notes without exposing the API token
// The actual auth is handled by Cloudflare Access on the frontend

// GET /api/notes-proxy - List all notes or get a specific one
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const noteId = searchParams.get("id");
    const tag = searchParams.get("tag");

    const index = await getNotesIndex();

    // If specific note requested
    if (noteId) {
      const noteMeta = index.notes.find(n => n.id === noteId);
      if (!noteMeta) {
        return Response.json({ error: "Note not found" }, { status: 404 });
      }
      
      const content = await getNoteContent(noteId);
      const note: Note = { ...noteMeta, content: content || "" };
      return Response.json(note);
    }

    // Filter by tag if provided
    let notes = index.notes;
    if (tag) {
      notes = notes.filter(n => n.tags.includes(tag));
    }

    return Response.json({
      notes,
      gameState: index.gameState,
      lastSync: index.lastSync,
    });
  } catch (error) {
    console.error("Error fetching notes:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/notes-proxy - Create a new note
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, tags = [] } = body;

    if (!title || typeof title !== "string") {
      return Response.json({ error: "Title is required" }, { status: 400 });
    }

    if (!content || typeof content !== "string") {
      return Response.json({ error: "Content is required" }, { status: 400 });
    }

    const index = await getNotesIndex();
    const now = new Date().toISOString();
    const noteId = randomUUID();
    
    const glyphsEarned = calculateNoteGlyphs(content, true);
    const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;

    const noteMeta: NoteMeta = {
      id: noteId,
      title,
      tags: Array.isArray(tags) ? tags : [tags],
      createdAt: now,
      updatedAt: now,
      glyphsEarned,
      wordCount,
    };

    index.notes.unshift(noteMeta);
    index.gameState.totalNotesGlyphs += glyphsEarned;
    index.gameState.notesCreated += 1;
    index.gameState = updateStreak(index.gameState);
    index.lastSync = now;

    await saveNoteContent(noteId, content);
    await saveNotesIndex(index);

    const note: Note = { ...noteMeta, content };

    return Response.json({
      note,
      glyphsEarned,
      gameState: index.gameState,
      message: `Note created! +${glyphsEarned} glyphes 📝`,
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating note:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/notes-proxy?id=xxx - Update a note
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    
    if (!id) {
      return Response.json({ error: "Note ID required" }, { status: 400 });
    }

    const body = await request.json();
    const { title, content, tags } = body;

    const index = await getNotesIndex();
    const noteIndex = index.notes.findIndex(n => n.id === id);
    
    if (noteIndex === -1) {
      return Response.json({ error: "Note not found" }, { status: 404 });
    }

    const existingNote = index.notes[noteIndex];
    const now = new Date().toISOString();

    let additionalGlyphs = 0;
    if (content && content !== await getNoteContent(id)) {
      const newGlyphs = calculateNoteGlyphs(content, false);
      const oldGlyphs = existingNote.glyphsEarned;
      additionalGlyphs = Math.max(0, newGlyphs - oldGlyphs);
    }

    const updatedMeta = {
      ...existingNote,
      title: title || existingNote.title,
      tags: tags !== undefined ? (Array.isArray(tags) ? tags : [tags]) : existingNote.tags,
      updatedAt: now,
      glyphsEarned: existingNote.glyphsEarned + additionalGlyphs,
      wordCount: content ? content.split(/\s+/).filter((w: string) => w.length > 0).length : existingNote.wordCount,
    };

    index.notes[noteIndex] = updatedMeta;
    index.gameState.totalNotesGlyphs += additionalGlyphs;
    index.lastSync = now;

    if (content) {
      await saveNoteContent(id, content);
    }
    await saveNotesIndex(index);

    const note: Note = { ...updatedMeta, content: content || await getNoteContent(id) || "" };

    return Response.json({
      note,
      additionalGlyphs,
      gameState: index.gameState,
      message: additionalGlyphs > 0 ? `Note updated! +${additionalGlyphs} glyphes 📝` : "Note updated!",
    });
  } catch (error) {
    console.error("Error updating note:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/notes-proxy?id=xxx - Delete a note
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    
    if (!id) {
      return Response.json({ error: "Note ID required" }, { status: 400 });
    }

    const index = await getNotesIndex();
    const noteIndex = index.notes.findIndex(n => n.id === id);
    
    if (noteIndex === -1) {
      return Response.json({ error: "Note not found" }, { status: 404 });
    }

    const deletedNote = index.notes[noteIndex];
    index.notes.splice(noteIndex, 1);
    index.lastSync = new Date().toISOString();

    await deleteNoteContent(id);
    await saveNotesIndex(index);

    return Response.json({
      message: "Note deleted",
      deletedNote: { id: deletedNote.id, title: deletedNote.title },
    });
  } catch (error) {
    console.error("Error deleting note:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
