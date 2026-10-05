import { lookup } from 'node:dns/promises';
import { BlockList, isIP } from 'node:net';

export class UnsafeUrlError extends Error {}

const MAX_REDIRECTS = 5;

// IANA special-purpose ranges: loopback, private, link-local (which covers the
// 169.254.169.254 cloud metadata endpoint), CGNAT, documentation, multicast,
// reserved, and the IPv6 transition prefixes that tunnel to an embedded IPv4
// address. IPv4-mapped IPv6 (::ffff:a.b.c.d) is checked against the IPv4 rules.
const NON_PUBLIC = new BlockList();
for (const [prefix, bits] of [
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['100.64.0.0', 10],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16],
  ['172.16.0.0', 12],
  ['192.0.0.0', 24],
  ['192.0.2.0', 24],
  ['192.88.99.0', 24],
  ['192.168.0.0', 16],
  ['198.18.0.0', 15],
  ['198.51.100.0', 24],
  ['203.0.113.0', 24],
  ['224.0.0.0', 4],
  ['240.0.0.0', 4],
] as const) {
  NON_PUBLIC.addSubnet(prefix, bits, 'ipv4');
}
for (const [prefix, bits] of [
  ['::', 96], // unspecified, loopback, deprecated IPv4-compatible
  ['64:ff9b::', 96], // NAT64
  ['64:ff9b:1::', 48],
  ['100::', 64], // discard
  ['2001::', 23], // Teredo, benchmarking, ORCHID, etc.
  ['2001:db8::', 32],
  ['2002::', 16], // 6to4
  ['fc00::', 7], // unique local
  ['fe80::', 10], // link-local
  ['ff00::', 8], // multicast
] as const) {
  NON_PUBLIC.addSubnet(prefix, bits, 'ipv6');
}

export function isPublicAddress(address: string): boolean {
  const family = isIP(address);
  if (!family) return false;
  return !NON_PUBLIC.check(address, family === 6 ? 'ipv6' : 'ipv4');
}

// Refuses anything but http(s) — Bun's fetch also reads file:// and s3:// — and
// any host that resolves to a non-public address. The fetch that follows does
// its own DNS lookup, so a host whose records change in between (DNS
// rebinding) isn't covered by this alone.
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

  const hostname = url.hostname.replace(/^\[(.*)\]$/, '$1');
  let addresses: { address: string }[];
  try {
    addresses = await lookup(hostname, { all: true });
  } catch {
    throw new UnsafeUrlError(`Could not resolve host: ${hostname}`);
  }

  if (!addresses.length) throw new UnsafeUrlError(`Could not resolve host: ${hostname}`);
  for (const { address } of addresses) {
    if (!isPublicAddress(address)) {
      throw new UnsafeUrlError(`Host resolves to a non-public address: ${hostname} -> ${address}`);
    }
  }

  return url;
}

// fetch() for urls that come from users or remote servers. Redirects are
// followed by hand so every hop gets the same check as the first, otherwise a
// public url could just 302 to an internal one.
export async function safeFetch(url: string, init: RequestInit = {}): Promise<Response> {
  let current = url;
  let { method = 'GET', body } = init;

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    await assertPublicUrl(current);
    const response = await fetch(current, { ...init, method, body, redirect: 'manual' });

    const location = response.headers.get('location');
    if (response.status < 300 || response.status >= 400 || !location) return response;

    current = new URL(location, current).toString();
    // Same as fetch's own redirect handling: 303, and 301/302 after a POST,
    // continue as a body-less GET; 307/308 replay the original request.
    if (response.status === 303 || ((response.status === 301 || response.status === 302) && method === 'POST')) {
      method = 'GET';
      body = undefined;
    }
  }

  throw new UnsafeUrlError(`Too many redirects: ${url}`);
}
