import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatINR, rupeesToPaise } from '../src/business/money.ts';

test('rupee inputs become exact integer paise without floating point rounding', () => {
  assert.equal(rupeesToPaise('499'), 49900);
  assert.equal(rupeesToPaise('0.29'), 29);
  assert.equal(rupeesToPaise(' 12.5 '), 1250);
  assert.equal(rupeesToPaise('0'), 0);
});
test('ambiguous, negative, overprecise, and overflowing amounts are rejected', () => {
  for (const value of ['', '-1', '1.005', '1e3', '1,000', 'NaN', '9007199254740992'])
    assert.throws(() => rupeesToPaise(value));
});
test('display formatting requires integer paise', () => {
  assert.match(formatINR(49900), /499\.00/);
  assert.match(formatINR(Number.MAX_SAFE_INTEGER), /\.91$/);
  for (const value of [-1, 1.5, NaN, Infinity]) assert.throws(() => formatINR(value));
});
