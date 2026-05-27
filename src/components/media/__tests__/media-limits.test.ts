import { describe, it, expect } from 'vitest';
import { MEDIA_LIMITS, isMimeAllowed, isSizeAllowed } from '../media-limits.js';

describe('media-limits (ui-side)', () => {
  it('matches backend limits for logo', () => {
    expect(isMimeAllowed('logo', 'image/png')).toBe(true);
    expect(isMimeAllowed('logo', 'image/svg+xml')).toBe(true);
    expect(isMimeAllowed('logo', 'image/gif')).toBe(false);
    expect(isSizeAllowed('logo', 1024 * 1024)).toBe(true);
    expect(isSizeAllowed('logo', 1024 * 1024 + 1)).toBe(false);
  });

  it('banner rejects SVG', () => {
    expect(isMimeAllowed('banner', 'image/svg+xml')).toBe(false);
  });
});
