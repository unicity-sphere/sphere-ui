import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { arrayMove } from '@dnd-kit/sortable';
import type { DragEndEvent, DragOverEvent } from '@dnd-kit/core';
import type { CanvasTrack } from './useCanvasState';

/** Minimal interface for achievement-like objects */
export interface CanvasAchievement {
  _id: string;
  title: string;
  sortOrder: number;
  trackId?: string | null;
  chains?: Record<string, number>;
  [key: string]: unknown;
}

export type AchSelectedItem =
  | { type: 'achievement'; id: string }
  | { type: 'track'; id: string }
  | null;

export type AchPendingChange =
  | { kind: 'ach-reorder'; laneId: string }
  | { kind: 'track-reorder' }
  | { kind: 'ach-field'; id: string; fields: Record<string, unknown> }
  | { kind: 'track-field'; id: string; fields: Record<string, unknown> };

function parseDndId(id: string): { type: 'ach' | 'track' | 'unassigned'; rawId: string } {
  if (id === 'unassigned') return { type: 'unassigned', rawId: 'unassigned' };
  const [type, rawId] = id.split(':');
  return { type: type as 'ach' | 'track', rawId };
}

function normalizeLaneId(id: string): string {
  if (id.startsWith('lane:')) return id.replace('lane:', 'track:');
  return id;
}

export function getAchLaneId(ach: CanvasAchievement): string {
  if (ach.trackId) return `track:${ach.trackId}`;
  return 'unassigned';
}

export function useAchievementCanvasState<T extends CanvasTrack, A extends CanvasAchievement>(tracks: T[], achievements: A[]) {

  const [trackOrder, setTrackOrder] = useState<string[]>([]);
  const [achOrderByLane, setAchOrderByLane] = useState<Map<string, string[]>>(new Map());
  const [selectedItem, setSelectedItem] = useState<AchSelectedItem>(null);
  const [activePanelTab, setActivePanelTab] = useState<'achievements' | 'tracks' | 'settings' | 'create' | 'chains'>('achievements');
  const [groupMode, setGroupMode] = useState<'track' | 'source'>('track');
  const [pendingChanges, setPendingChanges] = useState<AchPendingChange[]>([]);
  const [localAchFields, setLocalAchFields] = useState<Map<string, Partial<A>>>(new Map());
  const [localTrackFields, setLocalTrackFields] = useState<Map<string, Partial<T>>>(new Map());

  type UndoEntry = {
    trackOrder: string[];
    achOrderByLane: Map<string, string[]>;
    localAchFields: Map<string, Partial<A>>;
    localTrackFields: Map<string, Partial<T>>;
    pendingChanges: AchPendingChange[];
  };
  const undoStack = useRef<UndoEntry[]>([]);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  useEffect(() => {
    const sortedTracks = [...tracks].sort((a, b) => a.sortOrder - b.sortOrder);
    setTrackOrder(sortedTracks.map(t => `track:${t._id}`));
    const byLane = new Map<string, string[]>();
    for (const t of sortedTracks) {
      const laneId = `track:${t._id}`;
      const laneAchs = achievements.filter(a => getAchLaneId(a) === laneId).sort((a, b) => a.sortOrder - b.sortOrder);
      byLane.set(laneId, laneAchs.map(a => `ach:${a._id}`));
    }
    const unassigned = achievements.filter(a => getAchLaneId(a) === 'unassigned').sort((a, b) => a.sortOrder - b.sortOrder);
    byLane.set('unassigned', unassigned.map(a => `ach:${a._id}`));
    setAchOrderByLane(byLane);
    setPendingChanges([]);
    setLocalAchFields(new Map());
    setLocalTrackFields(new Map());
  }, [tracks, achievements]);

  const pushUndo = useCallback(() => {
    undoStack.current = [...undoStack.current.slice(-19), {
      trackOrder, achOrderByLane: new Map(achOrderByLane),
      localAchFields: new Map(localAchFields), localTrackFields: new Map(localTrackFields),
      pendingChanges: [...pendingChanges],
    }];
  }, [trackOrder, achOrderByLane, localAchFields, localTrackFields, pendingChanges]);

  const undo = useCallback(() => {
    const entry = undoStack.current.pop();
    if (!entry) return;
    setTrackOrder(entry.trackOrder);
    setAchOrderByLane(entry.achOrderByLane);
    setLocalAchFields(entry.localAchFields);
    setLocalTrackFields(entry.localTrackFields);
    setPendingChanges(entry.pendingChanges);
  }, []);

  const getAchievement = useCallback((id: string): A | undefined => {
    const base = achievements.find(a => a._id === id);
    if (!base) return undefined;
    const overrides = localAchFields.get(id);
    return overrides ? { ...base, ...overrides } : base;
  }, [achievements, localAchFields]);

  const getTrack = useCallback((id: string): T | undefined => {
    const base = tracks.find(t => t._id === id);
    if (!base) return undefined;
    const overrides = localTrackFields.get(id);
    return overrides ? { ...base, ...overrides } : base;
  }, [tracks, localTrackFields]);

  const getAchievementsForLane = useCallback((laneId: string): A[] => {
    const ids = achOrderByLane.get(laneId) ?? [];
    return ids.map(dndId => { const { rawId } = parseDndId(dndId); return getAchievement(rawId); }).filter((a): a is A => Boolean(a));
  }, [achOrderByLane, getAchievement]);

  const findLaneForAch = useCallback((achDndId: string): string | undefined => {
    for (const [laneId, ids] of achOrderByLane) { if (ids.includes(achDndId)) return laneId; }
    return undefined;
  }, [achOrderByLane]);

  const updateAchField = useCallback((id: string, fields: Partial<A>) => {
    pushUndo();
    setLocalAchFields(m => { const next = new Map(m); next.set(id, { ...(next.get(id) ?? {}), ...fields } as Partial<A>); return next; });
    setPendingChanges(p => [...p, { kind: 'ach-field', id, fields: fields as Record<string, unknown> }]);
    if ('trackId' in fields) {
      const achDndId = `ach:${id}`;
      const newLane = (fields as Record<string, unknown>).trackId ? `track:${(fields as Record<string, unknown>).trackId}` : 'unassigned';
      setAchOrderByLane(prev => {
        const next = new Map(prev);
        for (const [laneId, ids] of next) { if (ids.includes(achDndId)) { next.set(laneId, ids.filter(aid => aid !== achDndId)); break; } }
        const target = next.get(newLane) ?? [];
        if (!target.includes(achDndId)) next.set(newLane, [...target, achDndId]);
        return next;
      });
    }
  }, [pushUndo]);

  const updateTrackField = useCallback((id: string, fields: Partial<T>) => {
    pushUndo();
    setLocalTrackFields(m => { const next = new Map(m); next.set(id, { ...(next.get(id) ?? {}), ...fields } as Partial<T>); return next; });
    setPendingChanges(p => [...p, { kind: 'track-field', id, fields: fields as Record<string, unknown> }]);
  }, [pushUndo]);

  const handleDragStart = useCallback((id: string) => { setActiveDragId(id); }, []);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    const { type: activeType } = parseDndId(activeId);
    if (activeType !== 'ach') return;
    const sourceLane = findLaneForAch(activeId);
    if (!sourceLane) return;
    let targetLane: string;
    const normalizedOverId = normalizeLaneId(overId);
    const { type: overType } = parseDndId(normalizedOverId);
    if (overType === 'track' || normalizedOverId === 'unassigned') targetLane = normalizedOverId;
    else if (overType === 'ach') targetLane = findLaneForAch(normalizedOverId) ?? sourceLane;
    else return;
    if (sourceLane === targetLane) return;
    if (groupMode === 'source') return;
    setAchOrderByLane(prev => {
      const next = new Map(prev);
      const srcList = (next.get(sourceLane) ?? []).filter(id => id !== activeId);
      const tgtList = [...(next.get(targetLane) ?? []), activeId];
      next.set(sourceLane, srcList);
      next.set(targetLane, tgtList);
      return next;
    });
  }, [findLaneForAch, groupMode]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragId(null);
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    const { type: activeType, rawId: activeRawId } = parseDndId(activeId);
    if (activeType === 'track') {
      if (activeId === overId) return;
      pushUndo();
      setTrackOrder(arrayMove(trackOrder, trackOrder.indexOf(activeId), trackOrder.indexOf(overId)));
      setPendingChanges(p => [...p, { kind: 'track-reorder' }]);
      return;
    }
    if (activeType === 'ach') {
      const lane = findLaneForAch(activeId);
      if (!lane) return;
      const laneIds = achOrderByLane.get(lane) ?? [];
      const overIsInSameLane = laneIds.includes(overId);
      if (!overIsInSameLane) {
        const finalLane = findLaneForAch(activeId);
        if (finalLane) {
          pushUndo();
          setPendingChanges(p => [...p, { kind: 'ach-reorder', laneId: finalLane }]);
          if (finalLane !== 'unassigned') {
            const track = tracks.find(t => `track:${t._id}` === finalLane);
            if (track) updateAchField(activeRawId, { trackId: track._id } as Partial<A>);
          } else {
            updateAchField(activeRawId, { trackId: null } as Partial<A>);
          }
        }
        return;
      }
      if (activeId === overId) return;
      pushUndo();
      const newLaneIds = arrayMove(laneIds, laneIds.indexOf(activeId), laneIds.indexOf(overId));
      setAchOrderByLane(prev => { const next = new Map(prev); next.set(lane, newLaneIds); return next; });
      setPendingChanges(p => [...p, { kind: 'ach-reorder', laneId: lane }]);
    }
  }, [trackOrder, achOrderByLane, tracks, findLaneForAch, pushUndo, updateAchField]);

  const reset = useCallback(() => {
    const sortedTracks = [...tracks].sort((a, b) => a.sortOrder - b.sortOrder);
    setTrackOrder(sortedTracks.map(t => `track:${t._id}`));
    const byLane = new Map<string, string[]>();
    for (const t of sortedTracks) {
      const laneId = `track:${t._id}`;
      byLane.set(laneId, achievements.filter(a => getAchLaneId(a) === laneId).sort((a, b) => a.sortOrder - b.sortOrder).map(a => `ach:${a._id}`));
    }
    byLane.set('unassigned', achievements.filter(a => getAchLaneId(a) === 'unassigned').sort((a, b) => a.sortOrder - b.sortOrder).map(a => `ach:${a._id}`));
    setAchOrderByLane(byLane);
    setPendingChanges([]);
    setLocalAchFields(new Map());
    setLocalTrackFields(new Map());
    undoStack.current = [];
  }, [tracks, achievements]);

  const selectItem = useCallback((item: AchSelectedItem) => { setSelectedItem(item); if (item) setActivePanelTab('settings'); }, []);

  const orderedTracks = useMemo(() => {
    return trackOrder.map(dndId => { const { rawId } = parseDndId(dndId); return getTrack(rawId); }).filter((t): t is T => Boolean(t));
  }, [trackOrder, getTrack]);

  return {
    orderedTracks, getAchievementsForLane, getAchievement, getTrack, trackOrder, achOrderByLane,
    groupMode, setGroupMode, activeDragId, handleDragStart, handleDragOver, handleDragEnd,
    selectedItem, selectItem, activePanelTab, setActivePanelTab,
    updateAchField, updateTrackField, undo,
    pendingChanges, hasPendingChanges: pendingChanges.length > 0, clearPendingChanges: () => setPendingChanges([]), reset,
  };
}
