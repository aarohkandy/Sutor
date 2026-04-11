let recordedBlob: Blob | null = null;

export function setRecordedBlob(blob: Blob | null): void {
  recordedBlob = blob;
}

export function getRecordedBlob(): Blob | null {
  return recordedBlob;
}

export function clearRecordedBlob(): void {
  recordedBlob = null;
}
