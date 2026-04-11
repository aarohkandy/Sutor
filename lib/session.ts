import { STORAGE_KEYS, safeSessionGet, safeSessionRemove, safeSessionSet } from "@/lib/storage";
import type { RecordingSessionPayload, StoredResultsPayload } from "@/lib/types";

export function getPracticeSession(): RecordingSessionPayload | null {
  return safeSessionGet<RecordingSessionPayload>(STORAGE_KEYS.practiceSession);
}

export function setPracticeSession(payload: RecordingSessionPayload): void {
  safeSessionSet(STORAGE_KEYS.practiceSession, payload);
}

export function clearPracticeSession(): void {
  safeSessionRemove(STORAGE_KEYS.practiceSession);
}

export function getResultsSession(): StoredResultsPayload | null {
  return safeSessionGet<StoredResultsPayload>(STORAGE_KEYS.practiceResults);
}

export function setResultsSession(payload: StoredResultsPayload): void {
  safeSessionSet(STORAGE_KEYS.practiceResults, payload);
}

export function clearResultsSession(): void {
  safeSessionRemove(STORAGE_KEYS.practiceResults);
}
