import { useCallback, useEffect, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  MEDIA_LIMITS,
  isMimeAllowed,
  isSizeAllowed,
  humanSize,
} from './media-limits.js';
import type { MediaKind, MediaUploadFn } from './types.js';
import { Input } from '../Input.js';

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
   *
   * In this mode the URL paste fallback is hidden — the parent entity does
   * not yet exist, so an external URL can't be persisted to it anyway.
   */
  deferUpload?: boolean;
  onFileSelected?: (file: File | null) => void;
}

type State =
  | { phase: 'idle' }
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

      // Pixel dimension + aspect-ratio check, so oversized images are rejected
      // here instead of failing the server confirm with a 422. SVG has no raster
      // dimensions — skip it. readImageSize returns null (→ skip) when it can't
      // decode, so this never blocks on environments without createImageBitmap.
      if (file.type !== 'image/svg+xml') {
        const size = await readImageSize(file);
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
        previewRef.current = URL.createObjectURL(file);
        setState({ phase: 'pending', file });
        onFileSelected?.(file);
        // Make sure no stale published URL is left in the parent form.
        onChange(null);
        return;
      }

      const abort = new AbortController();
      setState({ phase: 'uploading', file, progress: 0, abort });
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
      previewRef.current = URL.createObjectURL(file);

      try {
        const result = await uploadFn(file, {
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

  return (
    <div className="space-y-2">
      {label && <div className="text-sm text-neutral-700 dark:text-white/70">{label}</div>}

      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-orange-500 dark:border-brand-orange bg-orange-500/10 dark:bg-brand-orange/15'
            : 'border-neutral-200 dark:border-white/8'
        }`}
      >
        <span ref={fileInputRef} style={{ display: 'contents' }}>
          <input {...getInputProps()} aria-label="file uploader" />
        </span>
        {hasImage ? (
          <div className="flex items-center gap-4">
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

      {!deferUpload && (
        <>
          <div className="text-xs text-neutral-500 dark:text-white/45">or paste URL:</div>
          <Input
            type="url"
            placeholder="https://..."
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            // Empty input → onChange(null) so a manually-cleared URL actually
            // saves as "no logo". Previously the `urlInput && …` guard short-
            // circuited and the form kept the stale value.
            onBlur={() => onChange(urlInput.trim() || null)}
          />
        </>
      )}
    </div>
  );
}
