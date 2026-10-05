import { lookup } from 'node:dns/promises';

export class UnsafeUrlError extends Error {}

// Resolves hostname and refuses a URL whose address is loopback, private, link-local
// (which covers the 169.254.169.254 cloud metadata endpoint), or otherwise not meant
// to be reached from outside its own network. Checked before the real fetch, which
// still does its own DNS lookup, so a hostname whose records change between this
// check and the fetch (DNS rebinding) is not covered by this alone.
export async function assertPublicUrl(urlString: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(urlString);
  } catch {
    throw new UnsafeUrlError(`Not a valid URL: ${urlString}`);
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new UnsafeUrlError(`Unsupported URL scheme: ${url.protocol}`);
  }

  let addresses: { address: string; family: number }[];
  try {
    addresses = await lookup(url.hostname, { all: true });
  } catch {
    throw new UnsafeUrlError(`Could not resolve host: ${url.hostname}`);
  }

  for (const { address } of addresses) {
    if (isDisallowedAddress(address)) {
      throw new UnsafeUrlError(`Host resolves to a non-public address: ${url.hostname} -> ${address}`);
    }
  }

  return url;
}

function isDisallowedAddress(address: string): boolean {
  return isDisallowedIPv4(address) || isDisallowedIPv6(address);
}

function isDisallowedIPv4(address: string): boolean {
  const match = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(address);
  if (!match) return false;
  const [a, b] = [Number(match[1]), Number(match[2])];

  if (a === 0) return true; // 0.0.0.0/8
  if (a === 10) return true; // 10.0.0.0/8
  if (a === 127) return true; // 127.0.0.0/8 loopback
  if (a === 169 && b === 254) return true; // 169.254.0.0/16 link-local, cloud metadata
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
  if (a === 192 && b === 168) return true; // 192.168.0.0/16
  if (a === 100 && b >= 64 && b <= 127) return true; // 100.64.0.0/10 shared address space
  if (a >= 224) return true; // multicast and reserved

  return false;
}

function isDisallowedIPv6(address: string): boolean {
  const normalized = address.toLowerCase();
  if (normalized === '::1') return true; // loopback
  if (normalized === '::') return true; // unspecified
  if (normalized.startsWith('::ffff:')) {
    // IPv4-mapped IPv6: unwrap and re-check as IPv4.
    return isDisallowedIPv4(normalized.slice('::ffff:'.length));
  }
  if (normalized.startsWith('fe80:')) return true; // link-local
  if (/^f[cd][0-9a-f]{2}:/.test(normalized)) return true; // fc00::/7 unique local

  return false;
}
