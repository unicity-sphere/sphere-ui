import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { arrayMove } from '@dnd-kit/sortable';
import type { DragEndEvent, DragOverEvent } from '@dnd-kit/core';

/** Minimal interface for track-like objects */
export interface CanvasTrack {
  _id: string;
  title: string;
  sortOrder: number;
  accentHex?: string | null;
  [key: string]: unknown;
}

/** Minimal interface for quest-like objects */
export interface CanvasQuest {
  _id: string;
  title: string;
  sortOrder: number;
  trackId?: string | null;
  chains?: Record<string, number>;
  [key: string]: unknown;
}

export type SelectedItem =
  | { type: 'quest'; id: string }
  | { type: 'track'; id: string }
  | null;

export type PendingChange =
  | { kind: 'quest-reorder'; laneId: string }
  | { kind: 'track-reorder' }
  | { kind: 'quest-field'; id: string; fields: Record<string, unknown> }
  | { kind: 'track-field'; id: string; fields: Record<string, unknown> };

/** Deterministic color from a string — used for chain group coloring */
export function chainColor(group: string): string {
  let hash = 0;
  for (const c of group) hash = ((hash * 31) + c.charCodeAt(0)) & 0xffffffff;
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 70%, 55%)`;
}

/** Parse a DnD id like "quest:abc123" or "track:abc123" */
function parseDndId(id: string): { type: 'quest' | 'track' | 'unassigned'; rawId: string } {
  if (id === 'unassigned') return { type: 'unassigned', rawId: 'unassigned' };
  const [type, rawId] = id.split(':');
  return { type: type as 'quest' | 'track', rawId };
}

/** "lane:abc123" drop zone id -> canonical lane id "track:abc123" */
function normalizeLaneId(id: string): string {
  if (id.startsWith('lane:')) return id.replace('lane:', 'track:');
  return id;
}

export function getLaneId(quest: CanvasQuest): string {
  if (quest.trackId) return `track:${quest.trackId}`;
  return 'unassigned';
}

export function useCanvasState<T extends CanvasTrack, Q extends CanvasQuest>(tracks: T[], quests: Q[]) {

  // Local ordering state — initialized from server data, updated on drag
  const [trackOrder, setTrackOrder] = useState<string[]>([]);
  const [questOrderByLane, setQuestOrderByLane] = useState<Map<string, string[]>>(new Map());

  // Selection and UI state
  const [selectedItem, setSelectedItem] = useState<SelectedItem>(null);
  const [activePanelTab, setActivePanelTab] = useState<'quests' | 'tracks' | 'settings' | 'create' | 'chains'>('quests');

  // Pending changes for Save/Discard
  const [pendingChanges, setPendingChanges] = useState<PendingChange[]>([]);
  const [localQuestFields, setLocalQuestFields] = useState<Map<string, Partial<Q>>>(new Map());
  const [localTrackFields, setLocalTrackFields] = useState<Map<string, Partial<T>>>(new Map());

  // Undo history stack (max 20)
  type UndoEntry = {
    trackOrder: string[];
    questOrderByLane: Map<string, string[]>;
    localQuestFields: Map<string, Partial<Q>>;
    localTrackFields: Map<string, Partial<T>>;
    pendingChanges: PendingChange[];
  };
  const undoStack = useRef<UndoEntry[]>([]);

  // Active drag state (for tracking cross-lane moves)
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const dragSourceLane = useRef<string | null>(null);

  // Initialize from server data
  useEffect(() => {
    const sortedTracks = [...tracks].sort((a, b) => a.sortOrder - b.sortOrder);
    setTrackOrder(sortedTracks.map(t => `track:${t._id}`));

    const byLane = new Map<string, string[]>();
    for (const t of sortedTracks) {
      const laneId = `track:${t._id}`;
      const laneQuests = quests
        .filter(q => getLaneId(q) === laneId)
        .sort((a, b) => a.sortOrder - b.sortOrder);
      byLane.set(laneId, laneQuests.map(q => `quest:${q._id}`));
    }
    const unassigned = quests
      .filter(q => getLaneId(q) === 'unassigned')
      .sort((a, b) => a.sortOrder - b.sortOrder);
    byLane.set('unassigned', unassigned.map(q => `quest:${q._id}`));
    setQuestOrderByLane(byLane);
    setPendingChanges([]);
    setLocalQuestFields(new Map());
    setLocalTrackFields(new Map());
  }, [tracks, quests]); // eslint-disable-line react-hooks/exhaustive-deps

  const pushUndo = useCallback(() => {
    undoStack.current = [
      ...undoStack.current.slice(-19),
      {
        trackOrder,
        questOrderByLane: new Map(questOrderByLane),
        localQuestFields: new Map(localQuestFields),
        localTrackFields: new Map(localTrackFields),
        pendingChanges: [...pendingChanges],
      },
    ];
  }, [trackOrder, questOrderByLane, localQuestFields, localTrackFields, pendingChanges]);

  const undo = useCallback(() => {
    const entry = undoStack.current.pop();
    if (!entry) return;
    setTrackOrder(entry.trackOrder);
    setQuestOrderByLane(entry.questOrderByLane);
    setLocalQuestFields(entry.localQuestFields);
    setLocalTrackFields(entry.localTrackFields);
    setPendingChanges(entry.pendingChanges);
  }, []);

  // ─── Computed: get merged quest (local overrides + server data) ────────────

  const getQuest = useCallback((id: string): Q | undefined => {
    const base = quests.find(q => q._id === id);
    if (!base) return undefined;
    const overrides = localQuestFields.get(id);
    return overrides ? { ...base, ...overrides } : base;
  }, [quests, localQuestFields]);

  const getTrack = useCallback((id: string): T | undefined => {
    const base = tracks.find(t => t._id === id);
    if (!base) return undefined;
    const overrides = localTrackFields.get(id);
    return overrides ? { ...base, ...overrides } : base;
  }, [tracks, localTrackFields]);

  const getQuestsForLane = useCallback((laneId: string): Q[] => {
    const ids = questOrderByLane.get(laneId) ?? [];
    return ids.map(dndId => {
      const { rawId } = parseDndId(dndId);
      return getQuest(rawId);
    }).filter((q): q is Q => Boolean(q));
  }, [questOrderByLane, getQuest]);

  // Find which lane a quest DnD id belongs to
  const findLaneForQuest = useCallback((questDndId: string): string | undefined => {
    for (const [laneId, ids] of questOrderByLane) {
      if (ids.includes(questDndId)) return laneId;
    }
    return undefined;
  }, [questOrderByLane]);

  // ─── Field updates (inline edits) ──────────────────────────────────────────

  const updateQuestField = useCallback((id: string, fields: Partial<Q>) => {
    pushUndo();
    setLocalQuestFields(m => {
      const next = new Map(m);
      next.set(id, { ...(next.get(id) ?? {}), ...fields } as Partial<Q>);
      return next;
    });
    setPendingChanges(p => [...p, { kind: 'quest-field', id, fields: fields as Record<string, unknown> }]);

    // If track assignment changed, move quest to the new lane immediately
    const laneChanged = 'trackId' in fields;
    if (laneChanged) {
      const questDndId = `quest:${id}`;
      const newLane = (fields as Record<string, unknown>).trackId ? `track:${(fields as Record<string, unknown>).trackId}` : 'unassigned';

      setQuestOrderByLane(prev => {
        const next = new Map(prev);
        // Remove from current lane
        for (const [laneId, ids] of next) {
          if (ids.includes(questDndId)) {
            next.set(laneId, ids.filter(qid => qid !== questDndId));
            break;
          }
        }
        // Add to new lane (append at end)
        const target = next.get(newLane) ?? [];
        if (!target.includes(questDndId)) {
          next.set(newLane, [...target, questDndId]);
        }
        return next;
      });
    }
  }, [pushUndo]);

  const updateTrackField = useCallback((id: string, fields: Partial<T>) => {
    pushUndo();
    setLocalTrackFields(m => {
      const next = new Map(m);
      next.set(id, { ...(next.get(id) ?? {}), ...fields } as Partial<T>);
      return next;
    });
    setPendingChanges(p => [...p, { kind: 'track-field', id, fields: fields as Record<string, unknown> }]);
  }, [pushUndo]);

  // ─── DnD handlers ──────────────────────────────────────────────────────────

  const handleDragStart = useCallback((id: string) => {
    setActiveDragId(id);
    dragSourceLane.current = findLaneForQuest(id) ?? null;
  }, [findLaneForQuest]);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId   = String(over.id);
    const { type: activeType } = parseDndId(activeId);

    if (activeType !== 'quest') return;

    const sourceLane = findLaneForQuest(activeId);
    if (!sourceLane) return;

    let targetLane: string;
    const normalizedOverId = normalizeLaneId(overId);
    const { type: overType } = parseDndId(normalizedOverId);
    if (overType === 'track' || normalizedOverId === 'unassigned') {
      targetLane = normalizedOverId;
    } else if (overType === 'quest') {
      targetLane = findLaneForQuest(normalizedOverId) ?? sourceLane;
    } else {
      return;
    }

    if (sourceLane === targetLane) return;

    setQuestOrderByLane(prev => {
      const next = new Map(prev);
      const srcList = (next.get(sourceLane) ?? []).filter(id => id !== activeId);
      const tgtList = (next.get(targetLane) ?? []).filter(id => id !== activeId);
      const overIdx = tgtList.indexOf(overId);
      if (overIdx !== -1) {
        tgtList.splice(overIdx, 0, activeId);
      } else {
        tgtList.push(activeId);
      }
      next.set(sourceLane, srcList);
      next.set(targetLane, tgtList);
      return next;
    });
  }, [findLaneForQuest]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragId(null);

    if (!over) return;

    const activeId = String(active.id);
    const overId   = String(over.id);
    const { type: activeType, rawId: activeRawId } = parseDndId(activeId);

    // Track reorder
    if (activeType === 'track') {
      if (activeId === overId) return;
      pushUndo();
      const newOrder = arrayMove(
        trackOrder,
        trackOrder.indexOf(activeId),
        trackOrder.indexOf(overId),
      );
      setTrackOrder(newOrder);
      setPendingChanges(p => [...p, { kind: 'track-reorder' }]);
      return;
    }

    // Quest reorder within lane
    if (activeType === 'quest') {
      const currentLane = findLaneForQuest(activeId);
      if (!currentLane) return;

      const sourceLane = dragSourceLane.current;
      dragSourceLane.current = null;
      const isCrossLane = sourceLane !== null && sourceLane !== currentLane;

      if (isCrossLane) {
        pushUndo();
        setPendingChanges(p => [
          ...p,
          { kind: 'quest-reorder', laneId: currentLane },
          { kind: 'quest-reorder', laneId: sourceLane },
        ]);

        const track = currentLane === 'unassigned'
          ? null
          : tracks.find(t => `track:${t._id}` === currentLane);
        const newTrackId = track?._id ?? null;

        setPendingChanges(p => [...p, { kind: 'quest-field', id: activeRawId, fields: { trackId: newTrackId } }]);
        setLocalQuestFields(m => {
          const next = new Map(m);
          next.set(activeRawId, { ...(next.get(activeRawId) ?? {}), trackId: newTrackId } as Partial<Q>);
          return next;
        });
        return;
      }

      // Same lane reorder
      const laneIds = questOrderByLane.get(currentLane) ?? [];
      if (activeId === overId) return;
      pushUndo();
      const newLaneIds = arrayMove(laneIds, laneIds.indexOf(activeId), laneIds.indexOf(overId));
      setQuestOrderByLane(prev => {
        const next = new Map(prev);
        next.set(currentLane, newLaneIds);
        return next;
      });
      setPendingChanges(p => [...p, { kind: 'quest-reorder', laneId: currentLane }]);
    }
  }, [trackOrder, questOrderByLane, tracks, findLaneForQuest, pushUndo]);

  // ─── Reset to server state (Discard) ───────────────────────────────────────

  const reset = useCallback(() => {
    const sortedTracks = [...tracks].sort((a, b) => a.sortOrder - b.sortOrder);
    setTrackOrder(sortedTracks.map(t => `track:${t._id}`));
    const byLane = new Map<string, string[]>();
    for (const t of sortedTracks) {
      const laneId = `track:${t._id}`;
      const laneQuests = quests
        .filter(q => getLaneId(q) === laneId)
        .sort((a, b) => a.sortOrder - b.sortOrder);
      byLane.set(laneId, laneQuests.map(q => `quest:${q._id}`));
    }
    const unassigned = quests
      .filter(q => getLaneId(q) === 'unassigned')
      .sort((a, b) => a.sortOrder - b.sortOrder);
    byLane.set('unassigned', unassigned.map(q => `quest:${q._id}`));
    setQuestOrderByLane(byLane);
    setPendingChanges([]);
    setLocalQuestFields(new Map());
    setLocalTrackFields(new Map());
    undoStack.current = [];
  }, [tracks, quests]);

  // ─── Selection ─────────────────────────────────────────────────────────────

  const selectItem = useCallback((item: SelectedItem) => {
    setSelectedItem(item);
    if (item) setActivePanelTab('settings');
  }, []);

  // ─── All ordered tracks (for rendering) ────────────────────────────────────

  const orderedTracks = useMemo(() => {
    return trackOrder
      .map(dndId => {
        const { rawId } = parseDndId(dndId);
        return getTrack(rawId);
      })
      .filter((t): t is T => Boolean(t));
  }, [trackOrder, getTrack]);

  return {
    // Data
    orderedTracks,
    getQuestsForLane,
    getQuest,
    getTrack,
    trackOrder,
    questOrderByLane,
    // DnD
    activeDragId,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    // Selection
    selectedItem,
    selectItem,
    // Panel
    activePanelTab,
    setActivePanelTab,
    // Edits
    updateQuestField,
    updateTrackField,
    // Undo
    undo,
    // Pending changes
    pendingChanges,
    hasPendingChanges: pendingChanges.length > 0,
    clearPendingChanges: () => setPendingChanges([]),
    reset,
  };
}
