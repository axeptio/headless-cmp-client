const test = require('node:test');
const assert = require('node:assert/strict');
const { appendAxeptioToken } = require('./axeptioToken');

const TOKEN = 'flfvv6d974b9jxwd';

test('appends the token to a URL with no query string', () => {
  assert.equal(
    appendAxeptioToken('https://shop.example/checkout', TOKEN),
    `https://shop.example/checkout?axeptio_token=${TOKEN}`
  );
});

test('preserves existing query parameters', () => {
  assert.equal(
    appendAxeptioToken('https://shop.example/checkout?step=1', TOKEN),
    `https://shop.example/checkout?step=1&axeptio_token=${TOKEN}`
  );
});

test('is idempotent: a second call does not duplicate the parameter', () => {
  const once = appendAxeptioToken('https://shop.example/checkout?step=1', TOKEN);
  assert.equal(appendAxeptioToken(once, TOKEN), once);
});

test('replaces an existing token rather than appending a second one', () => {
  assert.equal(
    appendAxeptioToken(`https://shop.example/c?axeptio_token=old&step=1`, TOKEN),
    `https://shop.example/c?step=1&axeptio_token=${TOKEN}`
  );
});

test('keeps the fragment at the end of the URL', () => {
  assert.equal(
    appendAxeptioToken('https://shop.example/checkout?step=1#payment', TOKEN),
    `https://shop.example/checkout?step=1&axeptio_token=${TOKEN}#payment`
  );
});

test('percent-encodes tokens containing URL-unsafe characters', () => {
  assert.equal(
    appendAxeptioToken('https://shop.example/c', 'a b&c=d'),
    'https://shop.example/c?axeptio_token=a%20b%26c%3Dd'
  );
});

test('returns the URL unchanged when the token is missing', () => {
  assert.equal(appendAxeptioToken('https://shop.example/c', ''), 'https://shop.example/c');
  assert.equal(appendAxeptioToken('https://shop.example/c', null), 'https://shop.example/c');
});

test('returns the URL unchanged when the URL is missing', () => {
  assert.equal(appendAxeptioToken('', TOKEN), '');
  assert.equal(appendAxeptioToken(null, TOKEN), null);
});
