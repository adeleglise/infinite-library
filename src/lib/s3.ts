import { S3Client, GetObjectCommand, PutObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";

// S3 Configuration for Hetzner
const s3Client = new S3Client({
  region: "nbg1",
  endpoint: "https://nbg1.your-objectstorage.com",
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
  },
  forcePathStyle: true,
});

const BUCKET = "clawd";
const NOTES_PREFIX = "notes/";

export interface NoteMeta {
  id: string;
  title: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  glyphsEarned: number;
  wordCount: number;
}

export interface NotesIndex {
  notes: NoteMeta[];
  gameState: {
    totalNotesGlyphs: number;
    notesCreated: number;
    lastNoteDate: string | null;
    streakDays: number;
  };
  lastSync: string;
  version: number;
}

export interface Note extends NoteMeta {
  content: string;
}

// Get the notes index from S3
export async function getNotesIndex(): Promise<NotesIndex> {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET,
      Key: `${NOTES_PREFIX}index.json`,
    });
    const response = await s3Client.send(command);
    const body = await response.Body?.transformToString();
    if (body) {
      return JSON.parse(body);
    }
  } catch (error: any) {
    if (error.name === "NoSuchKey" || error.$metadata?.httpStatusCode === 404) {
      // Return default index if not exists
      return {
        notes: [],
        gameState: {
          totalNotesGlyphs: 0,
          notesCreated: 0,
          lastNoteDate: null,
          streakDays: 0,
        },
        lastSync: new Date().toISOString(),
        version: 1,
      };
    }
    throw error;
  }
  return {
    notes: [],
    gameState: {
      totalNotesGlyphs: 0,
      notesCreated: 0,
      lastNoteDate: null,
      streakDays: 0,
    },
    lastSync: new Date().toISOString(),
    version: 1,
  };
}

// Save the notes index to S3
export async function saveNotesIndex(index: NotesIndex): Promise<void> {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: `${NOTES_PREFIX}index.json`,
    Body: JSON.stringify(index, null, 2),
    ContentType: "application/json",
  });
  await s3Client.send(command);
}

// Get a single note content from S3
export async function getNoteContent(id: string): Promise<string | null> {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET,
      Key: `${NOTES_PREFIX}${id}.md`,
    });
    const response = await s3Client.send(command);
    return await response.Body?.transformToString() || null;
  } catch (error: any) {
    if (error.name === "NoSuchKey" || error.$metadata?.httpStatusCode === 404) {
      return null;
    }
    throw error;
  }
}

// Save a note content to S3
export async function saveNoteContent(id: string, content: string): Promise<void> {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: `${NOTES_PREFIX}${id}.md`,
    Body: content,
    ContentType: "text/markdown",
  });
  await s3Client.send(command);
}

// Delete a note from S3
export async function deleteNoteContent(id: string): Promise<void> {
  const { DeleteObjectCommand } = await import("@aws-sdk/client-s3");
  const command = new DeleteObjectCommand({
    Bucket: BUCKET,
    Key: `${NOTES_PREFIX}${id}.md`,
  });
  await s3Client.send(command);
}

// Calculate glyphs earned from a note
export function calculateNoteGlyphs(content: string, isNew: boolean): number {
  const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;
  const charCount = content.length;
  
  let glyphs = 0;
  
  // Base glyphs for creating
  if (isNew) {
    glyphs += 10;
  }
  
  // Bonus for length
  if (charCount > 100) glyphs += 5;
  if (charCount > 500) glyphs += 15;
  if (charCount > 1000) glyphs += 30;
  if (charCount > 2000) glyphs += 50;
  
  // Bonus per word (capped)
  glyphs += Math.min(wordCount, 200);
  
  return glyphs;
}

// Check and update streak
export function updateStreak(gameState: NotesIndex["gameState"]): NotesIndex["gameState"] {
  const today = new Date().toISOString().split("T")[0];
  const lastDate = gameState.lastNoteDate?.split("T")[0];
  
  if (!lastDate) {
    return { ...gameState, lastNoteDate: new Date().toISOString(), streakDays: 1 };
  }
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];
  
  if (lastDate === today) {
    // Same day, no change
    return gameState;
  } else if (lastDate === yesterdayStr) {
    // Consecutive day, increase streak
    return { 
      ...gameState, 
      lastNoteDate: new Date().toISOString(), 
      streakDays: gameState.streakDays + 1 
    };
  } else {
    // Streak broken
    return { 
      ...gameState, 
      lastNoteDate: new Date().toISOString(), 
      streakDays: 1 
    };
  }
}
