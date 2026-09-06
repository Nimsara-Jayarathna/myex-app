import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

const root = resolve(import.meta.dirname, '..');
const read = (path: string) => readFileSync(resolve(root, path), 'utf8');

test('high-risk regressions stay out of the mobile source', () => {
  const source = [
    read('api/client.ts'),
    read('app/login.tsx'),
    read('app/register.tsx'),
    read('utils/sync-service.ts'),
    read('components/home/AddTransactionSheet.tsx'),
    read('components/home/all/TransactionList.tsx'),
  ].join('\n');

  const forbidden = [
    /cookies\s*:\s*cleanCookies/,
    /headers\s*:\s*response\.headers/,
    /password\.trim\s*\(/,
    /offline-income/,
    /offline-expense/,
    /Math\.random\s*\(/,
    /has_valid_session/,
  ];

  for (const pattern of forbidden) {
    assert.equal(pattern.test(source), false, `Forbidden source pattern found: ${pattern}`);
  }
});

test('transaction creation is non-retrying and carries an idempotency key', () => {
  const source = read('api/transactions.ts');
  assert.match(source, /'Idempotency-Key': idempotencyKey/);
  assert.match(source, /retryCount:\s*0/);
});
