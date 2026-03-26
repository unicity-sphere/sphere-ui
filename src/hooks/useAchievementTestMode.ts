import { useState, useCallback } from 'react';

export type AchTestState = 'locked' | 'ready' | 'completed' | 'claimed';

export interface AchievementProgressEntry {
  achievementId: string;
  current?: number;
  completed?: boolean;
  claimed?: boolean;
  [key: string]: unknown;
}

export interface AchTestModeState {
  active:        boolean;
  walletAddress: string;
  ignoreChain:   boolean;
  progressMap:   Map<string, AchievementProgressEntry>;
  loading:       boolean;
  error:         string | null;
}

/** Minimal achievement interface for test state computation */
interface TestableAchievement {
  _id: string;
  status: string;
  chains?: Record<string, number>;
}

/**
 * Compute the test-mode display state for a single achievement.
 */
export function computeAchTestState(
  ach:             TestableAchievement,
  state:           AchTestModeState,
  allAchievements: TestableAchievement[],
): AchTestState {
  const progress = state.progressMap.get(ach._id);
  if (progress?.claimed) return 'claimed';
  if (progress?.completed) return 'completed';

  if (ach.status !== 'ACTIVE') return 'locked';
  if (state.ignoreChain) return 'ready';

  // Check chain order
  const chains = ach.chains ?? {};
  for (const [group, order] of Object.entries(chains)) {
    if (order <= 0) continue;
    const prevOrder = order - 1;
    const prevAchs = allAchievements.filter(
      a => ((a.chains ?? {})[group] ?? -1) === prevOrder,
    );
    for (const pa of prevAchs) {
      const pp = state.progressMap.get(pa._id);
      if (!pp?.completed) return 'locked';
    }
  }

  return 'ready';
}

export function useAchievementTestMode(fetchProgressFn?: (address: string) => Promise<AchievementProgressEntry[]>) {
  const [state, setState] = useState<AchTestModeState>({
    active:        false,
    walletAddress: '',
    ignoreChain:   false,
    progressMap:   new Map(),
    loading:       false,
    error:         null,
  });

  const enterTestMode = useCallback(() => {
    setState(s => ({ ...s, active: true, progressMap: new Map(), error: null }));
  }, []);

  const exitTestMode = useCallback(() => {
    setState(s => ({ ...s, active: false, walletAddress: '', progressMap: new Map(), loading: false, error: null }));
  }, []);

  const toggleIgnoreChain = useCallback(() => {
    setState(s => ({ ...s, ignoreChain: !s.ignoreChain }));
  }, []);

  const setWalletAddress = useCallback((address: string) => {
    setState(s => ({ ...s, walletAddress: address }));
  }, []);

  const fetchProgress = useCallback(async (address?: string) => {
    const wallet = address ?? state.walletAddress;
    if (!wallet.trim() || !fetchProgressFn) return;

    setState(s => ({ ...s, loading: true, error: null, walletAddress: wallet }));
    try {
      const progress = await fetchProgressFn(wallet.trim());
      const map = new Map<string, AchievementProgressEntry>();
      for (const p of progress) {
        map.set(p.achievementId, p);
      }
      setState(s => ({ ...s, progressMap: map, loading: false }));
    } catch (err) {
      setState(s => ({
        ...s,
        loading: false,
        error: err instanceof Error ? err.message : String(err),
      }));
    }
  }, [state.walletAddress, fetchProgressFn]);

  const clearProgress = useCallback(() => {
    setState(s => ({ ...s, progressMap: new Map(), walletAddress: '', error: null }));
  }, []);

  return {
    testMode: state,
    enterTestMode,
    exitTestMode,
    toggleIgnoreChain,
    setWalletAddress,
    fetchProgress,
    clearProgress,
  };
}
