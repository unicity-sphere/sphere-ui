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

export function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < MB) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / MB).toFixed(1)} MB`;
}
