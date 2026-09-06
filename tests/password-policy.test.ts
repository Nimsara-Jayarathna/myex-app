import assert from 'node:assert/strict';
import test from 'node:test';

import { isStrongPassword } from '../utils/password-policy.ts';

test('password policy requires length and character classes', () => {
  assert.equal(isStrongPassword('Short1A'), false);
  assert.equal(isStrongPassword('longpassword1A'), true);
  assert.equal(isStrongPassword('LONGPASSWORD1A'), false);
  assert.equal(isStrongPassword('longpasswordAA'), false);
});
