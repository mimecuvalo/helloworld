import { lookup } from 'node:dns/promises';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { assertPublicUrl, isPublicAddress, safeFetch, UnsafeUrlError } from 'server/safe-fetch';

const lookupMock = vi.mocked(lookup) as unknown as ReturnType<typeof vi.fn>;
const resolvesTo = (...addresses: string[]) =>
  lookupMock.mockResolvedValue(addresses.map((address) => ({ address, family: address.includes(':') ? 6 : 4 })));

beforeEach(() => {
  lookupMock.mockReset();
  resolvesTo('93.184.216.34');
});

describe('isPublicAddress', () => {
  it.each([
    '0.0.0.0',
    '10.0.0.5',
    '100.64.0.1',
    '127.0.0.1',
    '169.254.169.254',
    '172.16.0.1',
    '172.31.255.255',
    '192.168.1.1',
    '198.18.0.1',
    '224.0.0.1',
    '255.255.255.255',
    '::',
    '::1',
    '::ffff:127.0.0.1',
    '::ffff:7f00:1',
    '::ffff:a9fe:a9fe',
    '64:ff9b::7f00:1',
    '2002:7f00:1::',
    'fd12:3456:789a::1',
    'fe80::1',
    'febf::1',
    'ff02::1',
  ])('rejects %s', (address) => {
    expect(isPublicAddress(address)).toBe(false);
  });

  it.each(['93.184.216.34', '8.8.8.8', '172.32.0.1', '::ffff:8.8.8.8', '2606:4700::1111'])('allows %s', (address) => {
    expect(isPublicAddress(address)).toBe(true);
  });
});

describe('assertPublicUrl', () => {
  it.each(['file:///etc/passwd', 's3://bucket/key', 'ftp://example.com/'])(
    'rejects %s before any DNS lookup',
    async (url) => {
      await expect(assertPublicUrl(url)).rejects.toThrow(UnsafeUrlError);
      expect(lookupMock).not.toHaveBeenCalled();
    }
  );

  it('rejects a hostname that resolves to a non-public address', async () => {
    resolvesTo('169.254.169.254');
    await expect(assertPublicUrl('http://metadata.internal/')).rejects.toThrow(UnsafeUrlError);
  });

  it('rejects when any one of several resolved addresses is non-public', async () => {
    resolvesTo('93.184.216.34', '10.0.0.1');
    await expect(assertPublicUrl('http://multi-homed.example/')).rejects.toThrow(UnsafeUrlError);
  });

  it('looks up a bracketed IPv6 literal without its brackets', async () => {
    resolvesTo('::1');
    await expect(assertPublicUrl('http://[::1]/')).rejects.toThrow(UnsafeUrlError);
    expect(lookupMock).toHaveBeenCalledWith('::1', { all: true });
  });

  it('rejects a host that does not resolve', async () => {
    lookupMock.mockRejectedValue(new Error('ENOTFOUND'));
    await expect(assertPublicUrl('https://nope.invalid/')).rejects.toThrow(UnsafeUrlError);
  });

  it('allows a hostname that resolves to a public address', async () => {
    await expect(assertPublicUrl('https://example.com/page')).resolves.toBeInstanceOf(URL);
  });
});

describe('safeFetch', () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  const redirect = (status: number, location: string) => new Response(null, { status, headers: { location } });

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('refuses a redirect to a non-public address', async () => {
    lookupMock.mockImplementation(async (host: string) => [
      { address: host === 'evil.example' ? '93.184.216.34' : '169.254.169.254', family: 4 },
    ]);
    fetchMock.mockResolvedValueOnce(redirect(302, 'http://metadata.internal/latest/meta-data/'));

    await expect(safeFetch('https://evil.example/x')).rejects.toThrow(UnsafeUrlError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ redirect: 'manual' });
  });

  it('follows a redirect between public hosts, resolving a relative location', async () => {
    fetchMock.mockResolvedValueOnce(redirect(301, '/moved')).mockResolvedValueOnce(new Response('ok'));

    const response = await safeFetch('https://example.com/start');
    expect(await response.text()).toBe('ok');
    expect(fetchMock.mock.calls[1][0]).toBe('https://example.com/moved');
  });

  it('turns a POST into a body-less GET on 303, and replays it on 307', async () => {
    fetchMock
      .mockResolvedValueOnce(redirect(307, 'https://example.com/b'))
      .mockResolvedValueOnce(redirect(303, 'https://example.com/c'))
      .mockResolvedValueOnce(new Response('ok'));

    await safeFetch('https://example.com/a', { method: 'POST', body: '{}' });
    expect(fetchMock.mock.calls[1][1]).toMatchObject({ method: 'POST', body: '{}' });
    expect(fetchMock.mock.calls[2][1]).toMatchObject({ method: 'GET', body: undefined });
  });

  it('gives up after too many redirects', async () => {
    fetchMock.mockImplementation(async () => redirect(302, 'https://example.com/loop'));
    await expect(safeFetch('https://example.com/loop')).rejects.toThrow(/Too many redirects/);
  });
});
