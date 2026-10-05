import { describe, expect, it, vi } from 'vitest';

const lookup = vi.fn();
vi.mock('node:dns/promises', () => ({ lookup, default: { lookup } }));

const { assertPublicUrl, UnsafeUrlError } = await import('server/util/safe-fetch');

describe('assertPublicUrl', () => {
  it('rejects a non-http(s) scheme before any DNS lookup', async () => {
    await expect(assertPublicUrl('file:///etc/passwd')).rejects.toThrow(UnsafeUrlError);
    expect(lookup).not.toHaveBeenCalled();
  });

  it('rejects a hostname that resolves to loopback', async () => {
    lookup.mockResolvedValueOnce([{ address: '127.0.0.1', family: 4 }]);
    await expect(assertPublicUrl('http://localhost/')).rejects.toThrow(UnsafeUrlError);
  });

  it('rejects a hostname that resolves to the cloud metadata address', async () => {
    lookup.mockResolvedValueOnce([{ address: '169.254.169.254', family: 4 }]);
    await expect(assertPublicUrl('http://metadata.internal/')).rejects.toThrow(UnsafeUrlError);
  });

  it('rejects a hostname that resolves to a private 10.x address', async () => {
    lookup.mockResolvedValueOnce([{ address: '10.0.0.5', family: 4 }]);
    await expect(assertPublicUrl('http://printer.lan/')).rejects.toThrow(UnsafeUrlError);
  });

  it('rejects a hostname that resolves to a private 192.168.x address', async () => {
    lookup.mockResolvedValueOnce([{ address: '192.168.1.1', family: 4 }]);
    await expect(assertPublicUrl('http://router.lan/')).rejects.toThrow(UnsafeUrlError);
  });

  it('rejects when any one of several resolved addresses is private', async () => {
    lookup.mockResolvedValueOnce([
      { address: '93.184.216.34', family: 4 },
      { address: '10.0.0.1', family: 4 },
    ]);
    await expect(assertPublicUrl('http://multi-homed.example/')).rejects.toThrow(UnsafeUrlError);
  });

  it('rejects an IPv6 loopback or unique-local address', async () => {
    lookup.mockResolvedValueOnce([{ address: '::1', family: 6 }]);
    await expect(assertPublicUrl('http://v6-localhost/')).rejects.toThrow(UnsafeUrlError);

    lookup.mockResolvedValueOnce([{ address: 'fd12:3456:789a::1', family: 6 }]);
    await expect(assertPublicUrl('http://v6-private/')).rejects.toThrow(UnsafeUrlError);
  });

  it('allows a hostname that resolves to an ordinary public address', async () => {
    lookup.mockResolvedValueOnce([{ address: '93.184.216.34', family: 4 }]);
    await expect(assertPublicUrl('https://example.com/page')).resolves.toBeInstanceOf(URL);
  });
});
