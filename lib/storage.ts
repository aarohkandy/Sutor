export const STORAGE_KEYS = {
  ollamaUrl: "sutor_ollama_url",
  noiseSensitivity: "sutor_noise_sensitivity",
  practiceSession: "sutor_practice_session",
  practiceResults: "sutor_practice_results"
} as const;

export function getNumberSetting(key: string, fallback: number): number {
  if (typeof window === "undefined") {
    return fallback;
  }

  const raw = window.localStorage.getItem(key);
  const value = raw ? Number(raw) : Number.NaN;
  return Number.isFinite(value) ? value : fallback;
}

export function getStringSetting(key: string): string {
  if (typeof window === "undefined") {
    return "";
  }

  return window.localStorage.getItem(key)?.trim() ?? "";
}

export function setLocalSetting(key: string, value: string | number): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(key, String(value));
}

export function safeSessionGet<T>(key: string): T | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.sessionStorage.getItem(key);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function safeSessionSet(key: string, value: unknown): void {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(key, JSON.stringify(value));
}

export function safeSessionRemove(key: string): void {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(key);
}
