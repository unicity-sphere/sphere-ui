import { useEffect, useState } from 'react';
import {
  DndContext, closestCenter, type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove, SortableContext, useSortable, horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MediaUploader } from './MediaUploader.js';
import type { MediaUploadFn } from './types.js';

export interface MediaItem {
  type: 'screenshot' | 'video';
  url: string;
}

export interface MediaGalleryProps {
  ownerType: 'project';
  ownerId: string;
  items: MediaItem[];
  onChange: (items: MediaItem[]) => void;
  uploadFn: MediaUploadFn;
  max?: number;
  /**
   * Defer mode: do NOT upload on select. Each chosen screenshot is kept locally
   * (a File + blob preview) and the current File list is emitted via
   * onFilesChange, so the parent can upload them AFTER the owner entity exists
   * (e.g. project create, before there is an ownerId — mirrors MediaUploader's
   * deferUpload for logo/banner). In this mode `items`/`onChange` are unused for
   * screenshots; the parent owns the upload + persistence.
   */
  deferUpload?: boolean;
  onFilesChange?: (files: File[]) => void;
}

function SortableTile({ item, onRemove }: { item: MediaItem; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.url });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <div ref={setNodeRef} style={style} className="relative w-24 h-24 rounded-lg border border-neutral-200 dark:border-white/8 overflow-hidden">
      <button {...attributes} {...listeners} aria-label="drag handle" className="absolute top-1 left-1 z-10 text-xs opacity-70 hover:opacity-100">⠿</button>
      <img src={item.url} alt={`${item.type} thumbnail`} className="w-full h-full object-cover" />
      <button
        type="button"
        aria-label="remove screenshot"
        onClick={onRemove}
        className="absolute top-1 right-1 z-10 text-xs bg-black/50 rounded-full w-5 h-5 flex items-center justify-center text-white"
      >✕</button>
    </div>
  );
}

export function MediaGallery({ ownerType, ownerId, items, onChange, uploadFn, max = 10, deferUpload, onFilesChange }: MediaGalleryProps) {
  const [adding, setAdding] = useState(false);
  // Defer mode: pending screenshots not yet uploaded (File + blob preview URL).
  const [pending, setPending] = useState<{ file: File; preview: string }[]>([]);

  // Revoke blob preview URLs on unmount (cleanup only — not per pending change).
  useEffect(
    () => () => { pending.forEach(p => URL.revokeObjectURL(p.preview)); },
    [], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const emitPending = (next: { file: File; preview: string }[]) => {
    setPending(next);
    onFilesChange?.(next.map(p => p.file));
  };

  function handleDragEnd(e: DragEndEvent) {
    if (!e.over || e.active.id === e.over.id) return;
    if (deferUpload) {
      const oldIndex = pending.findIndex(p => p.preview === e.active.id);
      const newIndex = pending.findIndex(p => p.preview === e.over!.id);
      emitPending(arrayMove(pending, oldIndex, newIndex));
    } else {
      const oldIndex = items.findIndex(i => i.url === e.active.id);
      const newIndex = items.findIndex(i => i.url === e.over!.id);
      onChange(arrayMove(items, oldIndex, newIndex));
    }
  }

  const count = deferUpload ? pending.length : items.length;
  const tileIds = deferUpload ? pending.map(p => p.preview) : items.map(i => i.url);

  return (
    <div
      className="space-y-2"
      onDragOver={e => e.preventDefault()}
      onDrop={e => e.preventDefault()}
    >
      <div className="text-sm text-neutral-700 dark:text-white/70">Screenshots ({count}/{max})</div>
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={tileIds} strategy={horizontalListSortingStrategy}>
          <div className="flex flex-wrap gap-2">
            {deferUpload
              ? pending.map((p, i) => (
                  <SortableTile
                    key={p.preview}
                    item={{ type: 'screenshot', url: p.preview }}
                    onRemove={() => {
                      URL.revokeObjectURL(p.preview);
                      emitPending(pending.filter((_, j) => j !== i));
                    }}
                  />
                ))
              : items.map((item, i) => (
                  <SortableTile
                    key={item.url}
                    item={item}
                    onRemove={() => onChange(items.filter((_, j) => j !== i))}
                  />
                ))}
            {count < max && !adding && (
              <button
                type="button"
                aria-label="add screenshot"
                onClick={() => setAdding(true)}
                className="w-24 h-24 rounded-lg border-2 border-dashed border-neutral-200 dark:border-white/8 text-2xl hover:border-orange-500 dark:hover:border-brand-orange"
              >+</button>
            )}
          </div>
        </SortableContext>
      </DndContext>
      {adding && (
        <div className="border border-neutral-200 dark:border-white/8 rounded-lg p-3">
          <MediaUploader
            kind="screenshot"
            ownerType={ownerType}
            ownerId={ownerId}
            uploadFn={uploadFn}
            deferUpload={deferUpload}
            onFileSelected={deferUpload
              ? (file) => {
                  if (file) {
                    const preview = URL.createObjectURL(file);
                    emitPending([...pending, { file, preview }]);
                  }
                  setAdding(false);
                }
              : undefined}
            onChange={deferUpload
              ? () => {}
              : (url) => {
                  if (url) {
                    const isDuplicate = items.some(i => i.url === url);
                    if (!isDuplicate) {
                      onChange([...items, { type: 'screenshot', url }]);
                    }
                  }
                  setAdding(false);
                }}
            label="Add screenshot"
          />
          <button type="button" onClick={() => setAdding(false)} className="text-xs mt-2 underline">Cancel</button>
        </div>
      )}
    </div>
  );
}
