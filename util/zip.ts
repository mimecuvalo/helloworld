import { deflateRawSync } from 'node:zlib';

// A minimal ZIP writer, so "export my data" doesn't pull in an archiver
// dependency for what is a header, a deflate call, and a footer. Everything
// here is the 1989 APPNOTE format: local header per entry, a central directory
// listing them, and an end-of-central-directory record pointing at it.
//
// Deliberately no zip64 and no streaming: the export is JSON text, which
// deflates to a few megabytes at worst, and the crc32 has to see the whole
// entry anyway.

export type ZipEntry = { name: string; data: string | Uint8Array };

const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let bit = 0; bit < 8; bit++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) crc = CRC32_TABLE[(crc ^ bytes[i]!) & 0xff]! ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

// MS-DOS packed date/time: seconds have 2-second resolution and the epoch is
// 1980, which is as much fidelity as the format offers.
function dosDateTime(date: Date): { time: number; date: number } {
  return {
    time: (date.getHours() << 11) | (date.getMinutes() << 5) | (date.getSeconds() >> 1),
    date: ((Math.max(date.getFullYear(), 1980) - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate(),
  };
}

export function createZip(entries: ZipEntry[], modifiedAt = new Date()): Uint8Array {
  const { time, date } = dosDateTime(modifiedAt);
  const encoder = new TextEncoder();

  const locals: Buffer[] = [];
  const centrals: Buffer[] = [];
  let offset = 0;

  for (const entry of entries) {
    const name = encoder.encode(entry.name);
    const raw = typeof entry.data === 'string' ? encoder.encode(entry.data) : entry.data;
    const compressed = deflateRawSync(raw);
    const crc = crc32(raw);

    const local = Buffer.alloc(30 + name.length);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4); // version needed: 2.0 (deflate)
    local.writeUInt16LE(0x0800, 6); // flag bit 11: the name is UTF-8
    local.writeUInt16LE(8, 8); // method: deflate
    local.writeUInt16LE(time, 10);
    local.writeUInt16LE(date, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(compressed.length, 18);
    local.writeUInt32LE(raw.length, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28); // no extra field
    Buffer.from(name).copy(local, 30);

    const central = Buffer.alloc(46 + name.length);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4); // version made by
    central.writeUInt16LE(20, 6); // version needed
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(8, 10);
    central.writeUInt16LE(time, 12);
    central.writeUInt16LE(date, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(compressed.length, 20);
    central.writeUInt32LE(raw.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt16LE(0, 30); // extra length
    central.writeUInt16LE(0, 32); // comment length
    central.writeUInt16LE(0, 34); // disk number start
    central.writeUInt16LE(0, 36); // internal attributes
    // External attributes: unix mode in the high word — regular file, rw-r--r--.
    // The >>> 0 matters: << 16 on a mode that large lands in the sign bit.
    central.writeUInt32LE((0o100644 << 16) >>> 0, 38);
    central.writeUInt32LE(offset, 42);
    Buffer.from(name).copy(central, 46);

    locals.push(local, compressed);
    centrals.push(central);
    offset += local.length + compressed.length;
  }

  const centralDirectory = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4); // this disk
  end.writeUInt16LE(0, 6); // disk with the central directory
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralDirectory.length, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20); // no archive comment

  return new Uint8Array(Buffer.concat([...locals, centralDirectory, end]));
}
