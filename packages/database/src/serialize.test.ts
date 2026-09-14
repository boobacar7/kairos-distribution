import { describe, expect, it } from 'vitest';

import { installJsonSerializers } from './serialize.js';

describe('BigInt JSON serializer', () => {
  it('stringifies BigInt as a decimal string rather than throwing', () => {
    installJsonSerializers();
    const payload = { id: 1n, totalSpent: 3_000_000_000n };
    expect(JSON.stringify(payload)).toBe('{"id":"1","totalSpent":"3000000000"}');
  });
});
