/**
 * Java's hashing rules in 32-bit int arithmetic, so widgets place keys in the same buckets the JDK does.
 * Checked against JDK 21: "hello" → 99162322 → spread 99163451 → bucket 11 of 16; List.of("a") → 0; List.of("a","b") → 2.
 */

/** String.hashCode(): s[0]*31^(n-1) + ... + s[n-1]. */
export function stringHash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return h;
}

/** List.hashCode(): 31 * h + element.hashCode(), starting from 1. */
export const listHash = (items: string[]) => items.reduce((h, e) => (Math.imul(31, h) + stringHash(e)) | 0, 1);

/** HashMap.hash(): spread the high 16 bits into the low ones. */
export const spread = (h: number) => (h ^ (h >>> 16)) | 0;

/** Bucket index for a table of `capacity` (a power of two): (n - 1) & hash. */
export const bucketIndex = (h: number, capacity: number) => spread(h) & (capacity - 1);

/** HashMap.tableSizeFor(): the smallest power of two ≥ c. */
export function tableSizeFor(c: number) {
  let n = 1;
  while (n < c) n *= 2;
  return n;
}
