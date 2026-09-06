import assert from 'node:assert/strict';
import test from 'node:test';

import {
  fromMinorUnits,
  parsePositiveMoneyInput,
  subtractMoney,
  sumMoney,
  toMinorUnits,
} from '../utils/money.ts';

test('money converts to and from integer minor units', () => {
  assert.equal(toMinorUnits(10.5), 1050);
  assert.equal(fromMinorUnits(1050), 10.5);
});

test('money sums without binary floating point drift', () => {
  assert.equal(sumMoney([0.1, 0.2]), 0.3);
  assert.equal(subtractMoney(0.3, 0.1), 0.2);
});

test('money input rejects zero, negative, invalid, and over-precision values', () => {
  assert.equal(parsePositiveMoneyInput('0'), null);
  assert.equal(parsePositiveMoneyInput('-1'), null);
  assert.equal(parsePositiveMoneyInput('abc'), null);
  assert.equal(parsePositiveMoneyInput('1.234'), null);
  assert.equal(parsePositiveMoneyInput('12.34'), 12.34);
});
