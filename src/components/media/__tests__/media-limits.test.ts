import { describe, it, expect } from 'vitest';
import {
  MEDIA_LIMITS,
  MAX_SOURCE_SIZE,
  isMimeAllowed,
  isSizeAllowed,
  isSourceSizeAllowed,
  sourceSizeLimit,
} from '../media-limits.js';

const MB = 1024 * 1024;

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

  describe('source size cap', () => {
    it('is far looser than maxSize for raster kinds — the bake shrinks them', () => {
      // A 24MP camera JPEG (~8-12MB) must reach the crop editor; maxSize
      // applies to the BAKED artifact, not the source.
      expect(isSourceSizeAllowed('banner', 'image/jpeg', 12 * MB)).toBe(true);
      expect(isSourceSizeAllowed('logo', 'image/png', 2 * MB)).toBe(true);
      expect(sourceSizeLimit('banner', 'image/jpeg')).toBe(MAX_SOURCE_SIZE);
    });

    it('still bounds a runaway read', () => {
      expect(isSourceSizeAllowed('banner', 'image/jpeg', MAX_SOURCE_SIZE)).toBe(true);
      expect(isSourceSizeAllowed('banner', 'image/jpeg', MAX_SOURCE_SIZE + 1)).toBe(false);
      expect(isSourceSizeAllowed('banner', 'image/jpeg', 0)).toBe(false);
    });

    it('tightens to maxSize for SVG — never re-encoded, the source IS the artifact', () => {
      expect(sourceSizeLimit('logo', 'image/svg+xml')).toBe(MEDIA_LIMITS.logo.maxSize);
      expect(isSourceSizeAllowed('logo', 'image/svg+xml', MEDIA_LIMITS.logo.maxSize)).toBe(true);
      expect(isSourceSizeAllowed('logo', 'image/svg+xml', MEDIA_LIMITS.logo.maxSize + 1)).toBe(false);
    });
  });
});
