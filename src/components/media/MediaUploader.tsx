import { useCallback, useEffect, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  MEDIA_LIMITS,
  isMimeAllowed,
  isSizeAllowed,
  humanSize,
} from './media-limits.js';
import type { MediaKind, MediaUploadFn, MediaLimit } from './types.js';
import { Input } from '../Input.js';
import { BannerCropEditor } from './BannerCropEditor.js';
import type { CropRect } from './crop-rect.js';

export interface MediaUploaderProps {
  kind: MediaKind;
  ownerType: 'project' | 'organization' | 'quest' | 'achievement' | 'track';
  ownerId: string;
  value?: string | null;
  onChange: (url: string | null) => void;
  uploadFn: MediaUploadFn;
  label?: string;
  /**
   * When true, do NOT call uploadFn on file selection. Instead store the file
   * locally, render a blob-URL preview, and call onFileSelected(file). The
   * consumer is responsible for uploading later (e.g. after creating the
   * parent entity to get a real ownerId).
   */
  deferUpload?: boolean;
  onFileSelected?: (file: File | null) => void;
}

type State =
  | { phase: 'idle' }
  | { phase: 'cropping'; file: File; previewUrl: string; rect: CropRect | null }
  | { phase: 'uploading'; file: File; progress: number; abort: AbortController }
  | { phase: 'pending';   file: File }
  | { phase: 'done' }
  | { phase: 'error'; message: string };

function formatExtensions(mimes: readonly string[]): string {
  return mimes.map((m) => m.split('/')[1]!.toUpperCase()).join(', ');
}

/**
 * Read an image's pixel dimensions client-side via createImageBitmap (decodes a
 * Blob directly, no DOM node). Returns null when it can't decode — a browser
 * without createImageBitmap, a corrupt file, or a non-decoding test env (jsdom)
 * — so the dimension check fails OPEN and the server stays the real gate.
 */
async function readImageSize(file: File): Promise<{ width: number; height: number } | null> {
  if (typeof createImageBitmap !== 'function') return null;
  try {
    const bitmap = await createImageBitmap(file);
    const size = { width: bitmap.width, height: bitmap.height };
    bitmap.close?.();
    return size;
  } catch {
    return null;
  }
}

/**
 * Whether this environment can actually bake a crop. `createImageBitmap` being
 * defined is NOT enough — jsdom defines it while returning null from
 * getContext('2d'), and some hardened browsers do the same. Probe the thing we
 * really need, or we would show a crop editor for a file we cannot crop and
 * only reject it after the author had framed it.
 */
function canBakeCrop(): boolean {
  if (typeof createImageBitmap !== 'function' || typeof document === 'undefined') return false;
  try {
    return document.createElement('canvas').getContext('2d') != null;
  } catch {
    return false;
  }
}

/**
 * Fit an image to a kind's constraints: crop (to `rect` when the author chose
 * one, else a centre crop to `aspectRatio`), then downscale to fit
 * `maxWidth`/`maxHeight`, re-encoding via canvas. Returns a NEW File. Returns
 * the original unchanged for SVG, when nothing needs changing, or when
 * canvas/createImageBitmap is unavailable (older browsers, jsdom) — so the
 * caller's fallback dimension check still applies in those cases.
 *
 * `rect` is in fractions of the source's natural size. Without it the behaviour
 * is exactly as before, which is what keeps every non-banner kind untouched.
 */
async function fitImage(file: File, limit: MediaLimit, rect?: CropRect): Promise<File> {
  if (file.type === 'image/svg+xml') return file;
  if (typeof createImageBitmap !== 'function' || typeof document === 'undefined') return file;
  try {
    const bitmap = await createImageBitmap(file);
    const sw = bitmap.width;
    const sh = bitmap.height;

    // Crop region: the author's rect when supplied, else a centre crop to
    // aspectRatio. Fractions convert to source pixels here and nowhere else.
    let cropW = sw, cropH = sh, cropX = 0, cropY = 0;
    if (rect) {
      cropX = Math.round(rect.x * sw);
      cropY = Math.round(rect.y * sh);
      cropW = Math.max(1, Math.round(rect.width * sw));
      cropH = Math.max(1, Math.round(rect.height * sh));
    } else if (limit.aspectRatio) {
      if (sw / sh > limit.aspectRatio) {
        cropW = Math.round(sh * limit.aspectRatio);
        cropX = Math.round((sw - cropW) / 2);
      } else if (sw / sh < limit.aspectRatio) {
        cropH = Math.round(sw / limit.aspectRatio);
        cropY = Math.round((sh - cropH) / 2);
      }
    }

    // Downscale the cropped region to fit max dimensions (never upscale).
    const scale = Math.min(1, (limit.maxWidth ?? cropW) / cropW, (limit.maxHeight ?? cropH) / cropH);
    const outW = Math.max(1, Math.round(cropW * scale));
    // Rounding width and height independently lets the output ratio drift — a
    // 3:1 crop can land on 1920x639 (3.005:1), which then reads as a permanent
    // sliver crop against a pinned 3:1 box, forever and invisibly. Derive the
    // height from the target ratio instead.
    const outH = limit.aspectRatio
      ? Math.max(1, Math.round(outW / limit.aspectRatio))
      : Math.max(1, Math.round(cropH * scale));

    // Nothing to crop, scale or re-ratio → keep original bytes (avoid a needless
    // re-encode).
    if (cropX === 0 && cropY === 0 && cropW === sw && cropH === sh && outW === sw && outH === sh) {
      bitmap.close?.();
      return file;
    }

    const canvas = document.createElement('canvas');
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext('2d');
    if (!ctx) { bitmap.close?.(); return file; }
    ctx.drawImage(bitmap, cropX, cropY, cropW, cropH, 0, 0, outW, outH);
    bitmap.close?.();

    const mime = file.type === 'image/jpeg' || file.type === 'image/webp' ? file.type : 'image/png';
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, mime, 0.92));
    if (!blob) return file;
    return new File([blob], file.name, { type: mime });
  } catch {
    return file;
  }
}

export function MediaUploader({
  kind,
  ownerType,
  ownerId,
  value,
  onChange,
  uploadFn,
  label,
  deferUpload,
  onFileSelected,
}: MediaUploaderProps) {
  const limit = MEDIA_LIMITS[kind];
  const [state, setState] = useState<State>({ phase: 'idle' });
  const [urlInput, setUrlInput] = useState(value && !value.startsWith('blob:') ? value : '');
  // Source toggle — exactly one of "upload" (file) / "url" is active, so a file
  // and a URL can never compete. Defaults to upload.
  const [source, setSource] = useState<'upload' | 'url'>('upload');
  const previewRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLSpanElement | null>(null);
  // Some legacy project records have logoUrl pointing to placehold.co — treat
  // these as "no logo" so the preview img doesn't render an orphan placeholder.
  const isPlaceholder = value?.includes('placehold.co') ?? false;

  // Cleanup blob URL on unmount
  useEffect(
    () => () => {
      if (previewRef.current) {
        URL.revokeObjectURL(previewRef.current);
        previewRef.current = null;
      }
    },
    [],
  );

  /**
   * Everything after the crop decision: fit, guard, then either defer or upload.
   * Shared by the direct path and the crop editor so the two cannot drift.
   */
  const finishFile = useCallback(
    async (file: File, rect?: CropRect) => {
      // Auto-fit: crop to the author's rect (banners) or centre-crop to the
      // kind's aspect ratio, then downscale to its max dimensions, so a
      // near-miss image (e.g. a 1.17:1 logo, or an oversized banner) is fixed
      // and uploaded instead of rejected. No-op for SVG and when canvas is
      // unavailable (older browsers, jsdom).
      const fitted = await fitImage(file, limit, rect);

      // Fallback guard: if fitImage could not process (no canvas), reject an
      // out-of-spec image so the server does not 422. After a successful fit this
      // passes. SVG has no raster dimensions — skip.
      if (fitted.type !== 'image/svg+xml') {
        const size = await readImageSize(fitted);
        if (size) {
          const { width, height } = size;
          if ((limit.maxWidth && width > limit.maxWidth) || (limit.maxHeight && height > limit.maxHeight)) {
            setState({
              phase: 'error',
              message: `Image too large (max ${limit.maxWidth}×${limit.maxHeight}px — this is ${width}×${height})`,
            });
            return;
          }
          if (limit.aspectRatio) {
            const ratio = width / height;
            const tolerance = limit.aspectTolerance ?? 0;
            if (Math.abs(ratio - limit.aspectRatio) > limit.aspectRatio * tolerance) {
              setState({
                phase: 'error',
                message: `Wrong aspect ratio (need ~${limit.aspectRatio}:1 — this is ${ratio.toFixed(2)}:1)`,
              });
              return;
            }
          }
        }
      }

      // Defer mode: store the file, show preview, notify parent. No upload yet.
      if (deferUpload) {
        if (previewRef.current) URL.revokeObjectURL(previewRef.current);
        previewRef.current = URL.createObjectURL(fitted);
        setState({ phase: 'pending', file: fitted });
        onFileSelected?.(fitted);
        // Make sure no stale published URL is left in the parent form.
        onChange(null);
        return;
      }

      const abort = new AbortController();
      setState({ phase: 'uploading', file: fitted, progress: 0, abort });
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
      previewRef.current = URL.createObjectURL(fitted);

      try {
        const result = await uploadFn(fitted, {
          kind,
          ownerType,
          ownerId,
          signal: abort.signal,
          onProgress: (pct) =>
            setState((s) => (s.phase === 'uploading' ? { ...s, progress: pct } : s)),
        });
        onChange(result.publicUrl);
        setState({ phase: 'done' });
      } catch (e: unknown) {
        if (abort.signal.aborted) {
          setState({ phase: 'idle' });
          return;
        }
        const message = e instanceof Error ? e.message : 'Upload failed, please retry';
        setState({ phase: 'error', message });
      }
    },
    [kind, ownerType, ownerId, uploadFn, onChange, limit, deferUpload, onFileSelected],
  );

  const handleFile = useCallback(
    async (file: File) => {
      if (!isMimeAllowed(kind, file.type)) {
        setState({
          phase: 'error',
          message: `Format not supported (${formatExtensions(limit.mimes)} only)`,
        });
        return;
      }
      if (!isSizeAllowed(kind, file.size)) {
        setState({
          phase: 'error',
          message: `File too large (max ${humanSize(limit.maxSize)})`,
        });
        return;
      }

      // A file was chosen → clear any pasted URL so the two sources stay exclusive.
      setUrlInput('');

      // Banners are the one kind whose framing is an authoring decision: every
      // surface renders them at a pinned 3:1, so whatever the centre crop threw
      // away is gone everywhere. Let the author choose it instead.
      //
      // Other kinds keep the implicit centre crop — for a logo it only fixes a
      // near-miss ratio, and ProjectLogo renders object-contain, so nothing is
      // ever cut at render time. SVG has no raster crop, and without a working
      // canvas there is nothing to bake, so fall through to the guard that
      // rejects an out-of-spec file instead of framing one we cannot produce.
      const canCrop =
        kind === 'banner' && file.type !== 'image/svg+xml' && canBakeCrop();

      if (canCrop) {
        if (previewRef.current) URL.revokeObjectURL(previewRef.current);
        previewRef.current = URL.createObjectURL(file);
        setState({ phase: 'cropping', file, previewUrl: previewRef.current, rect: null });
        return;
      }

      await finishFile(file);
    },
    [kind, limit, finishFile],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: Object.fromEntries(limit.mimes.map((m) => [m, []])),
    maxSize: limit.maxSize,
    multiple: false,
    onDropAccepted: (files) => {
      if (files[0]) void handleFile(files[0]);
    },
    onDropRejected: (rejections) => {
      const firstError = rejections[0]?.errors[0];
      if (firstError?.code === 'file-too-large') {
        setState({
          phase: 'error',
          message: `File too large (max ${humanSize(limit.maxSize)})`,
        });
      } else if (firstError?.code === 'file-invalid-type') {
        setState({
          phase: 'error',
          message: `Format not supported (${formatExtensions(limit.mimes)} only)`,
        });
      } else {
        setState({ phase: 'error', message: firstError?.message ?? 'File rejected' });
      }
    },
  });

  // Derived "has image" state — independent of state.phase so that a value
  // pre-filled from props (e.g. existing project with CDN logo) renders the
  // thumbnail layout immediately on mount.
  const hasUploadedValue = !!value && !isPlaceholder && !value.startsWith('blob:');
  const hasPendingFile = state.phase === 'pending' && !!previewRef.current;
  const hasDoneUpload = state.phase === 'done' && hasUploadedValue;
  const hasImage = hasPendingFile || hasDoneUpload || (state.phase === 'idle' && hasUploadedValue);
  const thumbnailSrc = hasPendingFile
    ? previewRef.current!
    : hasUploadedValue
      ? value!
      : '';
  const isSelected = hasPendingFile;

  const handleReplace = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Find the dropzone's input element (rendered by react-dropzone via
    // getInputProps()) and trigger the native file picker. We use a ref
    // attached to a wrapper span around the input so we don't have to fight
    // with react-dropzone's typed ref prop.
    fileInputRef.current?.querySelector('input')?.click();
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (previewRef.current) {
      URL.revokeObjectURL(previewRef.current);
      previewRef.current = null;
    }
    setState({ phase: 'idle' });
    onChange(null);
    setUrlInput('');
    if (deferUpload) onFileSelected?.(null);
  };

  // Commit the URL field as the value, clearing any selected/uploaded file so the
  // two sources stay mutually exclusive.
  const commitUrl = () => {
    const url = urlInput.trim();
    onChange(url || null);
    if (url) {
      if (previewRef.current) {
        URL.revokeObjectURL(previewRef.current);
        previewRef.current = null;
      }
      setState({ phase: 'idle' });
      if (deferUpload) onFileSelected?.(null);
    }
  };

  const tabClass = (active: boolean) =>
    `px-3 py-1 rounded-md transition-colors ${
      active
        ? 'bg-white dark:bg-white/10 text-neutral-900 dark:text-white shadow-sm'
        : 'text-neutral-500 dark:text-white/45 hover:text-neutral-700 dark:hover:text-white/70'
    }`;

  return (
    <div className="space-y-2">
      {label && <div className="text-sm text-neutral-700 dark:text-white/70">{label}</div>}

      <div className="inline-flex gap-0.5 rounded-lg p-0.5 bg-neutral-100 dark:bg-white/5 text-xs w-fit">
        <button type="button" onClick={() => setSource('upload')} className={tabClass(source === 'upload')}>Upload</button>
        <button type="button" onClick={() => setSource('url')} className={tabClass(source === 'url')}>URL</button>
      </div>

      {source === 'upload' && state.phase === 'cropping' && (
        <div className="space-y-3 border border-neutral-200 dark:border-white/8 rounded-lg p-3">
          <BannerCropEditor
            src={state.previewUrl}
            aspect={limit.aspectRatio ?? 3}
            onCropChange={(rect) =>
              setState((s) => (s.phase === 'cropping' ? { ...s, rect } : s))
            }
          />
          <div className="flex gap-2 text-xs">
            <button
              type="button"
              onClick={() => { void finishFile(state.file, state.rect ?? undefined); }}
              className="px-3 py-1.5 rounded-md bg-orange-500 dark:bg-brand-orange text-white font-medium"
            >
              Apply
            </button>
            <button
              type="button"
              onClick={() => {
                if (previewRef.current) {
                  URL.revokeObjectURL(previewRef.current);
                  previewRef.current = null;
                }
                setState({ phase: 'idle' });
              }}
              className="px-3 py-1.5 rounded-md text-neutral-500 dark:text-white/45 underline-offset-2 hover:underline ml-auto"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {source === 'upload' && state.phase !== 'cropping' && (
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors min-h-[128px] flex flex-col items-center justify-center ${
          isDragActive
            ? 'border-orange-500 dark:border-brand-orange bg-orange-500/10 dark:bg-brand-orange/15'
            : 'border-neutral-200 dark:border-white/8'
        }`}
      >
        <span ref={fileInputRef} style={{ display: 'contents' }}>
          <input {...getInputProps()} aria-label="file uploader" />
        </span>
        {hasImage ? (
          <div className="flex items-center gap-4 w-full">
            <img
              src={thumbnailSrc}
              alt="uploaded"
              className="w-16 h-16 rounded-lg object-cover border border-neutral-200 dark:border-white/8 shrink-0"
            />
            <div className="flex-1 text-left min-w-0">
              <div className="text-sm text-green-500 dark:text-green-400 flex items-center gap-1">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {isSelected ? 'Selected' : 'Uploaded'}
              </div>
              {isSelected && (
                <div className="text-[10px] text-neutral-500 dark:text-white/45 mt-0.5">
                  Uploads when you save
                </div>
              )}
              {hasPendingFile && (
                <div className="text-xs text-neutral-500 dark:text-white/45 mt-0.5 truncate">
                  {state.file.name}
                </div>
              )}
              <div className="flex gap-2 mt-2 text-xs">
                <button
                  type="button"
                  onClick={handleReplace}
                  className="text-neutral-700 dark:text-white/70 hover:text-orange-500 dark:hover:text-brand-orange underline-offset-2 hover:underline"
                >
                  Replace
                </button>
                <button
                  type="button"
                  onClick={handleRemove}
                  className="text-neutral-700 dark:text-white/70 hover:text-red-500 dark:hover:text-red-400 underline-offset-2 hover:underline"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        ) : state.phase === 'idle' ? (
          <>
            <div className="text-sm mb-1">Drop image here or click to choose</div>
            <div className="text-xs text-neutral-500 dark:text-white/45">
              {formatExtensions(limit.mimes)} · max {humanSize(limit.maxSize)}
              {limit.maxWidth && limit.maxHeight && ` · ${limit.maxWidth}×${limit.maxHeight}`}
            </div>
          </>
        ) : state.phase === 'uploading' ? (
          <>
            {previewRef.current && (
              <img
                src={previewRef.current}
                alt="upload preview"
                className="max-w-[64px] max-h-[64px] rounded object-cover border border-neutral-200 dark:border-white/8 mx-auto mb-2"
              />
            )}
            <div className="text-sm">Uploading {state.file.name}…</div>
            <progress
              className="w-full"
              value={state.progress}
              max={100}
              aria-label="upload progress"
              aria-valuetext={`${state.progress}%`}
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                state.abort.abort();
              }}
              className="text-xs mt-1 underline"
            >
              Cancel
            </button>
          </>
        ) : state.phase === 'error' ? (
          <>
            <div className="text-sm text-red-500">{state.message}</div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setState({ phase: 'idle' });
              }}
              className="text-xs mt-1 underline"
            >
              Try again
            </button>
          </>
        ) : null}
      </div>
      )}

      {source === 'url' && (
        <>
          <Input
            type="url"
            placeholder="https://..."
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            // Commit on blur. commitUrl clears any selected file so exactly one
            // source (Upload vs URL) is ever active.
            onBlur={commitUrl}
          />
          {kind === 'banner' && (
            // No crop editor here on purpose: a linked image is cross-origin,
            // drawing it into a canvas clears the origin-clean flag and the
            // toBlob() that bakes the crop throws SecurityError. Setting
            // crossOrigin="anonymous" would not degrade gracefully either — a
            // host without Access-Control-Allow-Origin would fail the load
            // outright, breaking images that render fine today.
            <div className="text-[10px] text-neutral-500 dark:text-white/45">
              Crop is available for uploaded files. Linked images are centred automatically.
            </div>
          )}
        </>
      )}
    </div>
  );
}
