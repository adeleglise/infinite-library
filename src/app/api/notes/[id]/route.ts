import { NextRequest } from "next/server";
import { verifyApiToken, unauthorizedResponse } from "@/lib/auth";
import { 
  getNotesIndex, 
  saveNotesIndex, 
  saveNoteContent, 
  getNoteContent,
  deleteNoteContent,
  calculateNoteGlyphs,
  type Note 
} from "@/lib/s3";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/notes/[id] - Get a specific note
export async function GET(request: NextRequest, { params }: RouteParams) {
  if (!verifyApiToken(request)) {
    return unauthorizedResponse();
  }

  try {
    const { id } = await params;
    const index = await getNotesIndex();
    const noteMeta = index.notes.find(n => n.id === id);
    
    if (!noteMeta) {
      return Response.json({ error: "Note not found" }, { status: 404 });
    }

    const content = await getNoteContent(id);
    const note: Note = { ...noteMeta, content: content || "" };
    
    return Response.json(note);
  } catch (error) {
    console.error("Error fetching note:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/notes/[id] - Update a note
export async function PUT(request: NextRequest, { params }: RouteParams) {
  if (!verifyApiToken(request)) {
    return unauthorizedResponse();
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { title, content, tags } = body;

    const index = await getNotesIndex();
    const noteIndex = index.notes.findIndex(n => n.id === id);
    
    if (noteIndex === -1) {
      return Response.json({ error: "Note not found" }, { status: 404 });
    }

    const existingNote = index.notes[noteIndex];
    const now = new Date().toISOString();

    // Calculate additional glyphs for new content
    let additionalGlyphs = 0;
    if (content && content !== await getNoteContent(id)) {
      const newGlyphs = calculateNoteGlyphs(content, false);
      const oldGlyphs = existingNote.glyphsEarned;
      additionalGlyphs = Math.max(0, newGlyphs - oldGlyphs);
    }

    // Update metadata
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

    // Save content if provided
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

// DELETE /api/notes/[id] - Delete a note
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  if (!verifyApiToken(request)) {
    return unauthorizedResponse();
  }

  try {
    const { id } = await params;
    const index = await getNotesIndex();
    const noteIndex = index.notes.findIndex(n => n.id === id);
    
    if (noteIndex === -1) {
      return Response.json({ error: "Note not found" }, { status: 404 });
    }

    const deletedNote = index.notes[noteIndex];
    
    // Remove from index (keep glyphs earned - no penalty for deleting)
    index.notes.splice(noteIndex, 1);
    index.lastSync = new Date().toISOString();

    // Delete content file
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
