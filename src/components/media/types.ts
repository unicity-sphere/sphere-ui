export type MediaKind = 'logo' | 'banner' | 'screenshot' | 'image' | 'background';
export type MediaMime = 'image/png' | 'image/jpeg' | 'image/webp' | 'image/svg+xml';

/**
 * Every entity that can own an uploaded asset. Mirrors OWNER_TYPES in
 * sphere-api's src/lib/media-limits.ts — the two must stay in step, since the
 * value is sent verbatim to /api/upload/presign.
 */
export const MEDIA_OWNER_TYPES = [
  'project', 'organization', 'quest', 'achievement', 'track', 'announcement',
] as const;

export type MediaOwnerType = typeof MEDIA_OWNER_TYPES[number];

export interface MediaLimit {
  mimes: readonly MediaMime[];
  maxSize: number;
  maxWidth?: number;
  maxHeight?: number;
  aspectRatio?: number;
  aspectTolerance?: number;
}

export interface MediaUploadResult {
  publicUrl: string;
  assetId: string;
}

export interface MediaUploadFn {
  (file: File, opts: {
    kind: MediaKind;
    ownerType: MediaOwnerType;
    ownerId: string;
    onProgress?: (pct: number) => void;
    signal?: AbortSignal;
  }): Promise<MediaUploadResult>;
}
