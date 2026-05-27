/** @deprecated Direct Gemini calls removed — use NestJS `askQuery` via m03Api. */
export async function queryGemini() {
  throw new Error("Browser Gemini access is disabled. Use the NestJS Ask Anything API.");
}

export function buildSystemPrompt() {
  return "";
}
