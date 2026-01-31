import { NextRequest } from "next/server";

// Verify API token from Authorization header
export function verifyApiToken(request: NextRequest): boolean {
  const authHeader = request.headers.get("Authorization");
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return false;
  }
  
  const token = authHeader.slice(7); // Remove "Bearer " prefix
  const validToken = process.env.NOTES_API_TOKEN;
  
  if (!validToken) {
    console.error("NOTES_API_TOKEN not configured");
    return false;
  }
  
  return token === validToken;
}

// Middleware response for unauthorized
export function unauthorizedResponse() {
  return Response.json(
    { error: "Unauthorized", message: "Invalid or missing API token" },
    { status: 401 }
  );
}
