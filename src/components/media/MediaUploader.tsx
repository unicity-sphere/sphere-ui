import { useCallback, useEffect, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  MEDIA_LIMITS,
  isMimeAllowed,
  isSizeAllowed,
  humanSize,
} from './media-limits.js';
import type { MediaKind, MediaUploadFn } from './types.js';

export interface MediaUploaderProps {
  kind: MediaKind;
  ownerType: 'project' | 'organization' | 'quest' | 'achievement' | 'track';
  ownerId: string;
  value?: string | null;
  onChange: (url: string | null) => void;
  uploadFn: MediaUploadFn;
  label?: string;
}

type State =
  | { phase: 'idle' }
  | { phase: 'uploading'; file: File; progress: number; abort: AbortController }
  | { phase: 'done' }
  | { phase: 'error'; message: string };

function formatExtensions(mimes: readonly string[]): string {
  return mimes.map((m) => m.split('/')[1]!.toUpperCase()).join(', ');
}

export function MediaUploader({
  kind,
  ownerType,
  ownerId,
  value,
  onChange,
  uploadFn,
  label,
}: MediaUploaderProps) {
  const limit = MEDIA_LIMITS[kind];
  const [state, setState] = useState<State>({ phase: 'idle' });
  const [urlInput, setUrlInput] = useState(value && !value.startsWith('blob:') ? value : '');
  const previewRef = useRef<string | null>(null);

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
    [kind, ownerType, ownerId, uploadFn, onChange, limit],
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

  return (
    <div className="space-y-2">
      {label && <div className="text-sm text-[--text-secondary]">{label}</div>}

      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-[--radius-md] p-6 text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-[--accent] bg-[--accent-glow]' : 'border-[--border]'
        }`}
      >
        <input {...getInputProps()} aria-label="file uploader" />
        {state.phase === 'idle' && (
          <>
            <div className="text-sm mb-1">Drop image here or click to choose</div>
            <div className="text-xs text-[--text-muted]">
              {formatExtensions(limit.mimes)} · max {humanSize(limit.maxSize)}
              {limit.maxWidth && limit.maxHeight && ` · ${limit.maxWidth}×${limit.maxHeight}`}
            </div>
          </>
        )}
        {state.phase === 'uploading' && (
          <>
            {previewRef.current && (
              <img
                src={previewRef.current}
                alt="upload preview"
                className="max-w-[64px] max-h-[64px] rounded-[--radius-sm] object-cover border border-[--border] mx-auto mb-2"
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
        )}
        {state.phase === 'done' && <div className="text-sm text-green-500">✓ Uploaded</div>}
        {state.phase === 'error' && (
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
        )}
      </div>

      <div className="text-xs text-[--text-muted]">or paste URL:</div>
      <input
        type="url"
        placeholder="https://..."
        value={urlInput}
        onChange={(e) => setUrlInput(e.target.value)}
        onBlur={() => urlInput && onChange(urlInput)}
        className="w-full bg-[--bg-surface] border border-[--border] rounded-[--radius-sm] px-3 py-2 text-sm"
      />

      {value && (
        <img
          src={value}
          alt="current value preview"
          className="max-w-[64px] max-h-[64px] rounded-[--radius-sm] object-cover border border-[--border] mt-2"
        />
      )}
    </div>
  );
}
