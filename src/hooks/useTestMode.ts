import { useState, useCallback } from 'react';

export type QuestTestState = 'locked' | 'ready' | 'verifying' | 'passed' | 'failed';

export interface TestModeState {
  active:          boolean;
  withVerification: boolean;
  ignoreChain:     boolean;
  completedIds:    Set<string>;
  verifyingId:     string | null;
  failedIds:       Map<string, string>; // id -> reason
}

/** Minimal quest interface for test state computation */
interface TestableQuest {
  _id: string;
  status: string;
  prerequisites?: string[];
  chains?: Record<string, number>;
}

/**
 * Compute the test-mode display state for a single quest.
 * - ignoreChain=true  -> all ACTIVE quests are READY
 * - ignoreChain=false -> respect chains map + prerequisites
 */
export function computeQuestTestState(
  quest:       TestableQuest,
  state:       TestModeState,
  allQuests:   TestableQuest[],
): QuestTestState {
  if (state.completedIds.has(quest._id)) return 'passed';
  if (state.verifyingId === quest._id)   return 'verifying';
  if (state.failedIds.has(quest._id))    return 'failed';

  if (quest.status !== 'ACTIVE') return 'locked';

  if (state.ignoreChain) return 'ready';

  // Check prerequisites
  const prereqs = quest.prerequisites ?? [];
  for (const prereqId of prereqs) {
    if (!state.completedIds.has(prereqId)) return 'locked';
  }

  // Check chain order: ALL quests at the previous level in each chain must be completed
  const chains = quest.chains ?? {};
  for (const [group, order] of Object.entries(chains)) {
    if (order <= 0) continue;
    const prevOrder = order - 1;
    const prevQuests = allQuests.filter(
      q => ((q.chains ?? {})[group] ?? -1) === prevOrder,
    );
    for (const pq of prevQuests) {
      if (!state.completedIds.has(pq._id)) return 'locked';
    }
  }

  return 'ready';
}

export function useTestMode(verifyFn?: (questId: string) => Promise<{ passed: boolean; reason?: string }>) {
  const [state, setState] = useState<TestModeState>({
    active:           false,
    withVerification: false,
    ignoreChain:      false,
    completedIds:     new Set(),
    verifyingId:      null,
    failedIds:        new Map(),
  });

  const enterTestMode = useCallback(() => {
    setState(s => ({ ...s, active: true, completedIds: new Set(), verifyingId: null, failedIds: new Map() }));
  }, []);

  const exitTestMode = useCallback(() => {
    setState(s => ({ ...s, active: false, completedIds: new Set(), verifyingId: null, failedIds: new Map() }));
  }, []);

  const toggleVerification = useCallback(() => {
    setState(s => ({ ...s, withVerification: !s.withVerification }));
  }, []);

  const toggleIgnoreChain = useCallback(() => {
    setState(s => ({ ...s, ignoreChain: !s.ignoreChain }));
  }, []);

  const claimQuest = useCallback(async (questId: string) => {
    if (!state.active) return;

    if (!state.withVerification || !verifyFn) {
      // Instant claim
      setState(s => {
        const next = new Set(s.completedIds);
        next.add(questId);
        return { ...s, completedIds: next };
      });
      return;
    }

    // Dry-run verification
    setState(s => ({ ...s, verifyingId: questId }));
    try {
      const result = await verifyFn(questId);
      setState(s => {
        if (result.passed) {
          const next = new Set(s.completedIds);
          next.add(questId);
          return { ...s, verifyingId: null, completedIds: next };
        } else {
          const nextFailed = new Map(s.failedIds);
          nextFailed.set(questId, result.reason ?? 'Verification failed');
          return { ...s, verifyingId: null, failedIds: nextFailed };
        }
      });
    } catch {
      setState(s => {
        const nextFailed = new Map(s.failedIds);
        nextFailed.set(questId, 'Network error');
        return { ...s, verifyingId: null, failedIds: nextFailed };
      });
    }
  }, [state.active, state.withVerification, verifyFn]);

  const resetTest = useCallback(() => {
    setState(s => ({ ...s, completedIds: new Set(), verifyingId: null, failedIds: new Map() }));
  }, []);

  return {
    testMode: state,
    enterTestMode,
    exitTestMode,
    toggleVerification,
    toggleIgnoreChain,
    claimQuest,
    resetTest,
  };
}
