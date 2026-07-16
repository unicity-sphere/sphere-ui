import type { MediaKind, MediaLimit, MediaMime } from './types.js';

const MB = 1024 * 1024;

export const MEDIA_LIMITS: Record<MediaKind, MediaLimit> = {
  logo:       { mimes: ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'], maxSize: 1 * MB, maxWidth: 1024, maxHeight: 1024, aspectRatio: 1, aspectTolerance: 0.05 },
  banner:     { mimes: ['image/png', 'image/jpeg', 'image/webp'],                  maxSize: 3 * MB, maxWidth: 1920, maxHeight: 640,  aspectRatio: 3, aspectTolerance: 0.15 },
  screenshot: { mimes: ['image/png', 'image/jpeg', 'image/webp'],                  maxSize: 5 * MB, maxWidth: 2560, maxHeight: 1440 },
  image:      { mimes: ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'], maxSize: 1 * MB, maxWidth: 1024, maxHeight: 1024, aspectRatio: 1, aspectTolerance: 0.05 },
  background: { mimes: ['image/png', 'image/jpeg', 'image/webp'],                  maxSize: 3 * MB, maxWidth: 1920, maxHeight: 1080 },
} as const;

export function isMimeAllowed(kind: MediaKind, mime: string): mime is MediaMime {
  return (MEDIA_LIMITS[kind].mimes as readonly string[]).includes(mime);
}

export function isSizeAllowed(kind: MediaKind, size: number): boolean {
  return size > 0 && size <= MEDIA_LIMITS[kind].maxSize;
}

/**
 * Loose byte cap on the user-picked SOURCE file, before the crop/downscale
 * bake. Client-only — the server never sees the source (presign validates the
 * BAKED artifact's size), so this is deliberately not mirrored into sphere-api.
 * It bounds local read/decode cost, nothing more; the per-kind maxSize applies
 * to what is actually uploaded. Sized for real camera exports: a 61MP JPEG is
 * ~25-30MB, and a large source is exactly what the bake exists to shrink.
 */
export const MAX_SOURCE_SIZE = 32 * MB;

/**
 * Byte cap for a source file of the given mime. SVG is never re-encoded
 * (fitImage returns it untouched), so for SVG the source IS the uploaded
 * artifact and must meet the strict per-kind maxSize. Everything else is baked
 * afterwards and only needs the loose read-cost cap.
 */
export function sourceSizeLimit(kind: MediaKind, mime: string): number {
  return mime === 'image/svg+xml' ? MEDIA_LIMITS[kind].maxSize : MAX_SOURCE_SIZE;
}

export function isSourceSizeAllowed(kind: MediaKind, mime: string, size: number): boolean {
  return size > 0 && size <= sourceSizeLimit(kind, mime);
}

export function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < MB) return `${(bytes / 1024).toFixed(0)} KB`;
  const mb = bytes / MB;
  return Number.isInteger(mb) ? `${mb} MB` : `${mb.toFixed(1)} MB`;
}
