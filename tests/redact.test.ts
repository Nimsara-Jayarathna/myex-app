import assert from 'node:assert/strict';
import test from 'node:test';

import { redactSensitive } from '../utils/redact.ts';

test('redactSensitive removes nested authentication secrets', () => {
  const safe = redactSensitive({
    email: 'person@example.com',
    password: 'secret',
    currentPassword: 'old',
    nested: {
      headers: {
        Cookie: 'accessToken=abc',
        Authorization: 'Bearer abc',
      },
      otp: '123456',
      resetToken: 'token-value',
    },
  }) as any;

  assert.equal(safe.email, 'person@example.com');
  assert.equal(safe.password, '[redacted]');
  assert.equal(safe.currentPassword, '[redacted]');
  assert.equal(safe.nested.headers.Cookie, '[redacted]');
  assert.equal(safe.nested.headers.Authorization, '[redacted]');
  assert.equal(safe.nested.otp, '[redacted]');
  assert.equal(safe.nested.resetToken, '[redacted]');
});
