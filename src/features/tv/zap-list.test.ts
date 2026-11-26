import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import { zapIndex } from './zap-list';

const chans = ['a', 'b', 'c'].map((s) => ({ streamUrl: `http://x/${s}`, name: s }));

test('zapIndex moves forward and back with wrap-around', () => {
  assert.equal(zapIndex(chans, 'http://x/a', 1), 1);
  assert.equal(zapIndex(chans, 'http://x/c', 1), 0);
  assert.equal(zapIndex(chans, 'http://x/a', -1), 2);
});

test('zapIndex returns -1 for unknown channel or empty list', () => {
  assert.equal(zapIndex(chans, 'http://x/z', 1), -1);
  assert.equal(zapIndex([], 'http://x/a', 1), -1);
});
