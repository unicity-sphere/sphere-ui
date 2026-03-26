import { useState, useMemo, useCallback } from 'react';

/** Minimal interface for chainable achievements */
interface ChainableAchievement {
  _id: string;
  chains?: Record<string, number>;
  [key: string]: unknown;
}

export interface AchChainModeState {
  active:        boolean;
  selectedChain: string | null;
}

export interface AchChainModeActions {
  toggle:        () => void;
  selectChain:   (group: string) => void;
  deselectChain: () => void;
  exit:          () => void;
}

export interface AchChainModeComputed<T> {
  chainMap:    Map<string, T[]>;
  chainGroups: string[];
}

export type AchChainMode<T> = AchChainModeState & AchChainModeActions & AchChainModeComputed<T>;

export function useAchievementChainMode<T extends ChainableAchievement>(achievements: T[]): AchChainMode<T> {
  const [active, setActive] = useState(false);
  const [selectedChain, setSelectedChain] = useState<string | null>(null);

  const chainMap = useMemo(() => {
    const map = new Map<string, T[]>();
    for (const a of achievements) {
      const chains = a.chains ?? {};
      for (const group of Object.keys(chains)) {
        const list = map.get(group) ?? [];
        list.push(a);
        map.set(group, list);
      }
    }
    // Sort each group by its per-chain order
    for (const [group, list] of map) {
      list.sort((a, b) => ((a.chains ?? {})[group] ?? 0) - ((b.chains ?? {})[group] ?? 0));
    }
    return map;
  }, [achievements]);

  const chainGroups = useMemo(
    () => [...chainMap.keys()].sort(),
    [chainMap],
  );

  const toggle = useCallback(() => {
    setActive(prev => {
      if (prev) setSelectedChain(null);
      return !prev;
    });
  }, []);

  const selectChain = useCallback((group: string) => {
    setSelectedChain(group);
  }, []);

  const deselectChain = useCallback(() => {
    setSelectedChain(null);
  }, []);

  const exit = useCallback(() => {
    setActive(false);
    setSelectedChain(null);
  }, []);

  return {
    active, selectedChain,
    toggle, selectChain, deselectChain, exit,
    chainMap, chainGroups,
  };
}
