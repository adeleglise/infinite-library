import { NextRequest } from "next/server";
import { verifyApiToken, unauthorizedResponse } from "@/lib/auth";
import { 
  getNotesIndex, 
  saveNotesIndex, 
  saveNoteContent, 
  getNoteContent,
  calculateNoteGlyphs,
  updateStreak,
  type Note,
  type NoteMeta 
} from "@/lib/s3";
import { randomUUID } from "crypto";

// GET /api/notes - List all notes (metadata only)
// GET /api/notes?id=xxx - Get a specific note with content
export async function GET(request: NextRequest) {
  // Auth check
  if (!verifyApiToken(request)) {
    return unauthorizedResponse();
  }

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

    // Return metadata list + game state
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

// POST /api/notes - Create a new note
export async function POST(request: NextRequest) {
  // Auth check
  if (!verifyApiToken(request)) {
    return unauthorizedResponse();
  }

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
    
    // Calculate glyphs earned
    const glyphsEarned = calculateNoteGlyphs(content, true);
    const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;

    // Create note metadata
    const noteMeta: NoteMeta = {
      id: noteId,
      title,
      tags: Array.isArray(tags) ? tags : [tags],
      createdAt: now,
      updatedAt: now,
      glyphsEarned,
      wordCount,
    };

    // Update index
    index.notes.unshift(noteMeta); // Add to beginning
    index.gameState.totalNotesGlyphs += glyphsEarned;
    index.gameState.notesCreated += 1;
    index.gameState = updateStreak(index.gameState);
    index.lastSync = now;

    // Save content and index
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
