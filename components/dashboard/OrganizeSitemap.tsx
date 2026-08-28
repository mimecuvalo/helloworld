import { type DragEvent, useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { F, defineMessages, useIntl } from 'i18n';
import { rpc } from 'lib/rpc';
import { useSiteMap, type SiteMapItem } from 'lib/content-queries';
import styles from './dashboard.module.css';

const messages = defineMessages({
  error: { defaultMessage: "Couldn't save that order." },
  reorder: { defaultMessage: 'drag to reorder' },
  staleOrder: { defaultMessage: 'The sidebar changed somewhere else, so it has been reloaded. Try that drag again.' },
});

// A top-level row and the albums filed under it: the two lists the sidebar draws,
// and the two a drag can move something within. Sections sort among sections and
// albums among their own section's albums — moving something to a different
// section is a placement change, and stays with the selects in the editor.
type Group = { section: SiteMapItem; albums: SiteMapItem[] };

// The sitemap arrives flat, a section followed by its own albums.
function toGroups(siteMap: SiteMapItem[]): Group[] {
  const groups: Group[] = [];
  for (const item of siteMap) {
    if (item.album === 'main' && groups.length) groups[groups.length - 1].albums.push(item);
    else groups.push({ section: item, albums: [] });
  }
  return groups;
}

const flatten = (groups: Group[]) => groups.flatMap((group) => [group.section, ...group.albums]);

function move<T>(list: T[], from: number, to: number) {
  const next = list.slice();
  next.splice(to, 0, next.splice(from, 1)[0]);
  return next;
}

// Which list a row belongs to: 'main' for the top level, otherwise the name of
// the section whose albums it sits in. Two rows can only be swapped when this
// matches, and the server renumbers by the same key.
type Spot = { group: string; index: number };
const isSame = (a: Spot | null, b: Spot) => a?.group === b.group && a?.index === b.index;

export default function OrganizeSitemap({ username }: { username: string }) {
  const intl = useIntl();
  const queryClient = useQueryClient();
  const siteMap = useSiteMap(username);
  const [groups, setGroups] = useState<Group[]>([]);
  const [drag, setDrag] = useState<Spot | null>(null);
  const [over, setOver] = useState<Spot | null>(null);
  const [error, setError] = useState('');

  // The query stays the source of truth: a drop writes the new order into it on
  // success, and a failed save invalidates it, which lands back here as the
  // order the server actually has.
  useEffect(() => {
    if (siteMap.data) setGroups(toGroups(siteMap.data));
  }, [siteMap.data]);

  const save = useMutation({
    mutationFn: (json: { section: string; names: string[] }) =>
      rpc.api.content.order.$post({ json }).then(async (r) => {
        if (!r.ok) throw new Error(((await r.json()) as { error?: string }).error || '');
        return r.json();
      }),
    onSuccess: () => setError(''),
    onError: (ex: Error) => {
      setError(intl.formatMessage(ex.message === 'stale-order' ? messages.staleOrder : messages.error));
      queryClient.invalidateQueries({ queryKey: ['sitemap'] });
    },
  });

  // Nested draggables: an album row sits inside its section's row, so every
  // handler has to stop the event before the section underneath also claims it.
  const handleDragStart = (evt: DragEvent, spot: Spot) => {
    evt.stopPropagation();
    // Firefox refuses to start a drag at all without payload on the transfer.
    evt.dataTransfer.setData('text/plain', `${spot.group}:${spot.index}`);
    evt.dataTransfer.effectAllowed = 'move';
    setDrag(spot);
  };

  const handleDragOver = (evt: DragEvent, spot: Spot) => {
    evt.stopPropagation();
    // Leaving the default in place for a row in another list is what shows the
    // "can't drop here" cursor, which is the whole feedback for reorder-only.
    if (!drag || drag.group !== spot.group || drag.index === spot.index) return;
    evt.preventDefault();
    evt.dataTransfer.dropEffect = 'move';
    if (!isSame(over, spot)) setOver(spot);
  };

  const handleDrop = (evt: DragEvent, spot: Spot) => {
    evt.preventDefault();
    evt.stopPropagation();
    const from = drag;
    setDrag(null);
    setOver(null);
    if (!from || from.group !== spot.group || from.index === spot.index) return;

    // Dropping on a row means taking its place, and everything between the two
    // shifts up or down by one — the same thing the old site did.
    let next: Group[];
    let names: string[];
    if (spot.group === 'main') {
      next = move(groups, from.index, spot.index);
      names = next.map((group) => group.section.name);
    } else {
      const albums = move(groups.find((group) => group.section.name === spot.group)!.albums, from.index, spot.index);
      next = groups.map((group) => (group.section.name === spot.group ? { ...group, albums } : group));
      names = albums.map((album) => album.name);
    }

    setGroups(next);
    queryClient.setQueryData(['sitemap', username], flatten(next));
    save.mutate({ section: spot.group, names });
  };

  const row = (item: SiteMapItem, spot: Spot) => (
    <div
      className={[
        styles.organizeRow,
        isSame(drag, spot) ? styles.organizeRowDragging : '',
        isSame(over, spot) ? styles.organizeRowOver : '',
      ]
        .filter(Boolean)
        .join(' ')}
      draggable
      title={intl.formatMessage(messages.reorder)}
      onDragStart={(evt) => handleDragStart(evt, spot)}
      onDragEnd={() => {
        setDrag(null);
        setOver(null);
      }}
      onDragOver={(evt) => handleDragOver(evt, spot)}
      onDragLeave={(evt) => evt.stopPropagation()}
      onDrop={(evt) => handleDrop(evt, spot)}
    >
      <span className={styles.organizeGrip} aria-hidden="true">
        ⣿
      </span>
      <span className="notranslate">{item.title || item.name}</span>
      {item.hidden ? (
        <span className={styles.organizeTag}>
          <F defaultMessage="hidden" />
        </span>
      ) : null}
    </div>
  );

  if (siteMap.isPending) return null;

  return (
    <div className={styles.organize}>
      <h2>
        <F defaultMessage="organize sidebar" />
      </h2>
      <p className={styles.organizeHint}>
        <F defaultMessage="Drag a section to reorder the sidebar, or an album to reorder it within its section. To move a page somewhere else entirely, use the section and album selects while editing it." />
      </p>

      {error ? <p className={styles.dialogError}>{error}</p> : null}

      {!groups.length ? (
        <p className={styles.organizeHint}>
          <F defaultMessage="There is nothing in the sidebar yet." />
        </p>
      ) : null}

      <ul className={styles.organizeList}>
        {groups.map((group, index) => (
          <li key={group.section.name}>
            {row(group.section, { group: 'main', index })}
            {group.albums.length ? (
              <ul className={styles.organizeList}>
                {group.albums.map((album, albumIndex) => (
                  <li key={album.name}>{row(album, { group: group.section.name, index: albumIndex })}</li>
                ))}
              </ul>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
