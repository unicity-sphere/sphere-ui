export type MediaKind = 'logo' | 'banner' | 'screenshot' | 'image' | 'background';
export type MediaMime = 'image/png' | 'image/jpeg' | 'image/webp' | 'image/svg+xml';

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
    ownerType: 'project' | 'organization' | 'quest' | 'achievement' | 'track';
    ownerId: string;
    onProgress?: (pct: number) => void;
    signal?: AbortSignal;
  }): Promise<MediaUploadResult>;
}
