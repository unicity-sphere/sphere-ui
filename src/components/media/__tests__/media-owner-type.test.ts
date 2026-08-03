import { describe, it, expect } from 'vitest';
import { MEDIA_OWNER_TYPES } from '../types.js';

describe('MEDIA_OWNER_TYPES', () => {
  it('lists every owner type the API accepts, including announcement', () => {
    expect([...MEDIA_OWNER_TYPES]).toEqual([
      'project', 'organization', 'quest', 'achievement', 'track', 'announcement',
    ]);
  });
});
