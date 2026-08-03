import { describe, it, expect } from 'vitest';
import { priorityTheme } from '../theme.js';
// Raw text of this module's own source, for the source-scanning test below.
// `?raw` is a Vite import suffix that resolves to the file's literal text at
// transform time — used instead of node:fs/node:url because this repo has
// no @types/node installed for src/. Mirrors
// sphere-backoffice/src/lib/__tests__/announcementTheme.test.ts.
import themeSource from '../theme.ts?raw';

describe('priorityTheme', () => {
  it('pins critical exactly, including the left-edge border', () => {
    expect(priorityTheme('critical')).toEqual({
      label:       'Critical',
      accent:      'var(--announcement-alert)',
      pillClass:   'bg-[rgba(229,72,77,0.15)] text-[var(--announcement-alert-text)]',
      borderClass: 'border-[var(--announcement-alert-border)]',
      opensModal:  true,
    });
  });

  it('pins major exactly, including the left-edge border', () => {
    expect(priorityTheme('major')).toEqual({
      label:       'Major',
      accent:      'var(--accent)',
      pillClass:   'bg-[rgba(255,111,0,0.14)] text-[var(--accent)]',
      borderClass: 'border-[rgba(255,111,0,0.28)]',
      opensModal:  true,
    });
  });

  it('pins normal exactly — no accent colour, per product rule', () => {
    expect(priorityTheme('normal')).toEqual({
      label:       'Normal',
      accent:      'var(--text-secondary)',
      pillClass:   'bg-white/6 text-white/62',
      borderClass: 'border-[var(--border)]',
      opensModal:  false,
    });
  });

  // Regression guard, mirrors sphere-backoffice's announcementTheme.test.ts:
  // a template literal that interpolates a constant into a Tailwind bracket
  // class (`` `border-[${ALERT}]/28` ``) evaluates to a normal-looking string
  // at runtime — the pins above can't tell it apart from a literal — but
  // Tailwind's build-time scanner only reads the *source text*, so the
  // interpolated form never gets a rule and the border silently renders with
  // no colour. This reads the source text itself, the same thing the scanner
  // reads.
  it('never builds pillClass or borderClass by interpolation — Tailwind cannot scan the result', () => {
    const classLines = themeSource
      .split('\n')
      .filter((line: string) => line.includes('pillClass:') || line.includes('borderClass:'));
    expect(classLines.length).toBeGreaterThan(0);
    for (const line of classLines) {
      expect(line).not.toContain('${');
    }
  });

  // Regression guard: an opacity modifier applied to a `var()` arbitrary
  // value (`border-[var(--x)]/28`) has no precedent in this codebase and its
  // support isn't guaranteed across every consumer's Tailwind version —
  // colours with alpha belong baked into the token (`--announcement-alert-border`
  // in tokens.css) instead. This pins that choice so nobody reintroduces the
  // modifier form for a "cleaner" one-liner later.
  it('never applies an opacity modifier to a borderClass value', () => {
    for (const priority of ['critical', 'major', 'normal'] as const) {
      expect(priorityTheme(priority).borderClass).not.toMatch(/\]\/\d/);
    }
  });
});
