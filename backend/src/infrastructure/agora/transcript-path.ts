/**
 * Where a consultation's transcript lives in the bucket.
 *
 * Agora accepts only letters and digits in `fileNamePrefix` — a hyphen or
 * an underscore is refused outright — and our consultation ids are UUIDs,
 * so the dashes come out. The result is still unique, and the writer and
 * the reader share this one function so they cannot disagree about where
 * the file went.
 */
export function transcriptPrefix(requestId: string): string[] {
  return ['transcripts', requestId.replace(/[^a-zA-Z0-9]/g, '')];
}

/** The same path as a key prefix, for listing the bucket. */
export function transcriptKeyPrefix(requestId: string): string {
  return `${transcriptPrefix(requestId).join('/')}/`;
}
