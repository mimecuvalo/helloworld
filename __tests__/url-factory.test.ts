import { describe, expect, it } from 'vitest';
import { parseContentUrl } from 'lib/url-factory';

describe('parseContentUrl with a bare username', () => {
  it('does not throw on a value that is not a url', () => {
    // getRemoteFriends is called with a bare username in places; new URL()
    // would throw and take the caller down with it.
    expect(parseContentUrl('mime')).toEqual({ username: 'mime', name: 'home' });
  });

  it('still parses real urls and paths', () => {
    expect(parseContentUrl('https://example.com/alice/blog/hello')).toEqual({ username: 'alice', name: 'hello' });
    expect(parseContentUrl('/alice/blog/hello')).toEqual({ username: 'alice', name: 'hello' });
    expect(parseContentUrl('acct:alice@example.com')).toEqual({ username: 'alice', name: 'home' });
  });
});
