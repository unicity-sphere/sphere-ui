import { useState } from 'react';
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
}

function SortableTile({ item, onRemove }: { item: MediaItem; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.url });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <div ref={setNodeRef} style={style} className="relative w-24 h-24 rounded-[--radius-md] border border-[--border] overflow-hidden">
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

export function MediaGallery({ ownerType, ownerId, items, onChange, uploadFn, max = 10 }: MediaGalleryProps) {
  const [adding, setAdding] = useState(false);

  function handleDragEnd(e: DragEndEvent) {
    if (!e.over || e.active.id === e.over.id) return;
    const oldIndex = items.findIndex(i => i.url === e.active.id);
    const newIndex = items.findIndex(i => i.url === e.over!.id);
    onChange(arrayMove(items, oldIndex, newIndex));
  }

  return (
    <div
      className="space-y-2"
      onDragOver={e => e.preventDefault()}
      onDrop={e => e.preventDefault()}
    >
      <div className="text-sm text-[--text-secondary]">Screenshots ({items.length}/{max})</div>
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map(i => i.url)} strategy={horizontalListSortingStrategy}>
          <div className="flex flex-wrap gap-2">
            {items.map((item, i) => (
              <SortableTile
                key={item.url}
                item={item}
                onRemove={() => onChange(items.filter((_, j) => j !== i))}
              />
            ))}
            {items.length < max && !adding && (
              <button
                type="button"
                aria-label="add screenshot"
                onClick={() => setAdding(true)}
                className="w-24 h-24 rounded-[--radius-md] border-2 border-dashed border-[--border] text-2xl hover:border-[--accent]"
              >+</button>
            )}
          </div>
        </SortableContext>
      </DndContext>
      {adding && (
        <div className="border border-[--border] rounded-[--radius-md] p-3">
          <MediaUploader
            kind="screenshot"
            ownerType={ownerType}
            ownerId={ownerId}
            uploadFn={uploadFn}
            onChange={url => {
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
