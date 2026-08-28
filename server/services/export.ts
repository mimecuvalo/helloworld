import type { Context } from '../context';
import { assertAuthor } from '../authorization';
import { createZip, type ZipEntry } from '../../util/zip';
import { stripSecrets } from './user';

// Data liberation: everything this site holds about you in its database, as a
// zip of plain JSON. Not a backup — uploaded media lives in S3 and is
// referenced by url, not inlined — and deliberately not the private keys:
// those are this installation's federation identity, not portable data, and
// putting them in a file that lands in a downloads folder is how an identity
// gets stolen.

export const EXPORT_FORMAT_VERSION = 1;

// Rows are read in pages so a decade of feed items doesn't have to be resident
// all at once. The JSON is assembled by hand for the same reason: one string
// per page rather than one array of every row.
const PAGE_SIZE = 500;

async function jsonArray<T>(fetchPage: (skip: number, take: number) => Promise<T[]>): Promise<[string, number]> {
  const chunks: string[] = [];
  let count = 0;

  for (let skip = 0; ; skip += PAGE_SIZE) {
    const rows = await fetchPage(skip, PAGE_SIZE);
    if (!rows.length) break;

    for (const row of rows) chunks.push(JSON.stringify(row, null, 2));
    count += rows.length;
    if (rows.length < PAGE_SIZE) break;
  }

  return [`[\n${chunks.join(',\n')}\n]\n`, count];
}

export type ExportArchive = { filename: string; bytes: Uint8Array };

export async function exportUserData(ctx: Context): Promise<ExportArchive> {
  assertAuthor(ctx);

  const { prisma } = ctx;
  const user = ctx.currentUser!;
  const username = user.username;
  const exportedAt = new Date();

  const [[content, contentCount], [userRemote, userRemoteCount], [contentRemote, contentRemoteCount]] =
    await Promise.all([
      jsonArray((skip, take) => prisma.content.findMany({ where: { username }, orderBy: { id: 'asc' }, skip, take })),
      jsonArray((skip, take) =>
        prisma.userRemote.findMany({ where: { localUsername: username }, orderBy: { id: 'asc' }, skip, take })
      ),
      jsonArray((skip, take) =>
        prisma.contentRemote.findMany({ where: { toUsername: username }, orderBy: { id: 'asc' }, skip, take })
      ),
    ]);

  const manifest = {
    formatVersion: EXPORT_FORMAT_VERSION,
    exportedAt: exportedAt.toISOString(),
    username,
    hostname: ctx.hostname,
    counts: {
      content: contentCount,
      userRemote: userRemoteCount,
      contentRemote: contentRemoteCount,
    },
  };

  const entries: ZipEntry[] = [
    { name: 'README.md', data: readme(username, exportedAt) },
    { name: 'manifest.json', data: `${JSON.stringify(manifest, null, 2)}\n` },
    { name: 'user.json', data: `${JSON.stringify(stripSecrets(user), null, 2)}\n` },
    { name: 'content.json', data: content },
    { name: 'user-remote.json', data: userRemote },
    { name: 'content-remote.json', data: contentRemote },
  ];

  const stamp = exportedAt.toISOString().slice(0, 10);
  return { filename: `${username}-export-${stamp}.zip`, bytes: createZip(entries, exportedAt) };
}

function readme(username: string, exportedAt: Date) {
  return `# Data export for ${username}

Exported ${exportedAt.toISOString()} — format version ${EXPORT_FORMAT_VERSION}.

Every file is JSON, one array of rows per database table, straight out of the
schema. Field names match the columns.

| file | what's in it |
| --- | --- |
| \`manifest.json\` | when this was exported, and how many rows of each kind |
| \`user.json\` | your profile: name, title, description, theme, site settings |
| \`content.json\` | everything you wrote here — posts, pages, sections, albums |
| \`user-remote.json\` | the feeds you follow and the people who follow you |
| \`content-remote.json\` | items received from those feeds, plus comments and favorites on your posts |

Not included, on purpose:

- **Uploaded media.** Images and files live in object storage; the rows here
  reference them by url, and those urls keep working.
- **Private keys.** Your federation signing keys and any linked-account
  passwords stay on the server. They're this site's credentials for acting as
  you, not data about you, and a copy in a downloads folder is a liability.
`;
}
