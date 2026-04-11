import type { AlignedNote, SpeechEvent } from "@/lib/types";

interface OllamaGenerateResponse {
  response?: string;
  error?: string;
}

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, "");
}

export async function pingOllama(baseUrl: string): Promise<boolean> {
  try {
    const response = await fetch(`${normalizeBaseUrl(baseUrl)}/api/tags`, {
      method: "GET"
    });
    return response.ok;
  } catch {
    return false;
  }
}

export function buildTeacherPrompt(input: {
  instrument: string;
  title: string;
  composer: string;
  paired: AlignedNote[];
  speechEvents: SpeechEvent[];
}): string {
  return [
    `Instrument: ${input.instrument}`,
    `Piece: ${input.title} — ${input.composer}`,
    "",
    "Paired notes:",
    JSON.stringify(input.paired, null, 2),
    "",
    "Speech bookmarks:",
    JSON.stringify(input.speechEvents, null, 2),
    "",
    "You are a warm but realistic music teacher. Analyze the data above. Give a written summary of the player's performance. Identify specific recurring problems, not one-off mistakes. Point out what they did well. Suggest 2 to 3 specific things to work on. Be encouraging but honest. Do not use bullet points. Write in natural paragraphs."
  ].join("\n");
}

export async function generateOllamaSummary(baseUrl: string, prompt: string): Promise<string> {
  const response = await fetch(`${normalizeBaseUrl(baseUrl)}/api/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gemma",
      stream: false,
      prompt
    })
  });

  const payload = (await response.json()) as OllamaGenerateResponse;
  if (!response.ok || payload.error) {
    throw new Error(payload.error || `Ollama request failed with ${response.status}`);
  }

  return payload.response?.trim() || "Your analysis brain responded, but it did not return any text.";
}
