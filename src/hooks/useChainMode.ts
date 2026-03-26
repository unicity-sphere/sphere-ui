import { useState, useMemo, useCallback } from 'react';

/** Minimal interface for chainable items */
interface ChainableItem {
  _id: string;
  chains?: Record<string, number>;
  [key: string]: unknown;
}

export interface ChainModeState {
  active:        boolean;
  selectedChain: string | null;
}

export interface ChainModeActions {
  toggle:        () => void;
  selectChain:   (group: string) => void;
  deselectChain: () => void;
  exit:          () => void;
}

export interface ChainModeComputed<T> {
  chainMap:    Map<string, T[]>;
  chainGroups: string[];
}

export type ChainMode<T> = ChainModeState & ChainModeActions & ChainModeComputed<T>;

export function useChainMode<T extends ChainableItem>(items: T[]): ChainMode<T> {
  const [active, setActive] = useState(false);
  const [selectedChain, setSelectedChain] = useState<string | null>(null);

  const chainMap = useMemo(() => {
    const map = new Map<string, T[]>();
    for (const q of items) {
      const chains = q.chains ?? {};
      for (const group of Object.keys(chains)) {
        const list = map.get(group) ?? [];
        list.push(q);
        map.set(group, list);
      }
    }
    // Sort each group by its per-chain order
    for (const [group, list] of map) {
      list.sort((a, b) => ((a.chains ?? {})[group] ?? 0) - ((b.chains ?? {})[group] ?? 0));
    }
    return map;
  }, [items]);

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
