import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { F, defineMessages, useIntl } from 'i18n';
import { rpc } from 'lib/rpc';
import { useSiteMap, type SiteMapItem } from 'lib/content-queries';
import NameDialog from './NameDialog';
import styles from './editor.module.css';

// Underscores don't survive cleanName, so nothing real can ever be called this.
const NEW = '__new__';

const messages = defineMessages({
  album: { defaultMessage: 'album' },
  albumName: { defaultMessage: 'album name' },
  duplicateName: { defaultMessage: 'Something else already has that name.' },
  error: { defaultMessage: 'Could not create that.' },
  invalidName: { defaultMessage: 'That name has no letters or numbers in it.' },
  newAlbum: { defaultMessage: '+ new album…' },
  newSection: { defaultMessage: '+ new section…' },
  noAlbum: { defaultMessage: '-none-' },
  noSuchSection: { defaultMessage: 'That section is gone; pick another one.' },
  reservedName: { defaultMessage: "That name is reserved; it can't be used." },
  section: { defaultMessage: 'section' },
  sectionName: { defaultMessage: 'section name' },
  topLevel: { defaultMessage: 'main' },
});

const CREATE_ERRORS: Record<string, keyof typeof messages> = {
  'duplicate-name': 'duplicateName',
  'invalid-name': 'invalidName',
  'no-such-section': 'noSuchSection',
  'reserved-name': 'reservedName',
};

type Created = { section: string; album: string; name: string; title: string; hidden: boolean };

// The sitemap arrives flat — a section, then its albums, then the next section.
const sectionsOf = (siteMap: SiteMapItem[]) => siteMap.filter((item) => item.album !== 'main');
const albumsOf = (siteMap: SiteMapItem[], section: string) =>
  siteMap.filter((item) => item.album === 'main' && item.section === section);

// Nothing to add once the name is in the list — or when there is no name.
function withCurrent(items: SiteMapItem[], name: string) {
  if (!name || items.some((item) => item.name === name)) return items;
  return [{ username: '', section: '', album: '', name, title: name }, ...items];
}

// A new row has to be pickable the moment it exists, so it goes into the cached
// sitemap in the spot the server would have put it: a section last, an album
// after the ones its section already has. Without this the select spends a
// refetch holding a value none of its options has, and renders blank.
export function withCreated(siteMap: SiteMapItem[], created: Created): SiteMapItem[] {
  const item: SiteMapItem = { ...created, username: '' };
  if (created.album !== 'main') return [...siteMap, item];
  // Its section, or the last album that section already has — whichever comes
  // later is what the new album goes after.
  const at = siteMap
    .map((entry) => entry.name === created.section || entry.section === created.section)
    .lastIndexOf(true);
  return at < 0 ? [...siteMap, item] : [...siteMap.slice(0, at + 1), item, ...siteMap.slice(at + 1)];
}

// Where a page sits, as two selects living up in the tab strip: it is the thing
// most often changed while writing, and burying it in Options made it feel like
// a setting rather than part of the act of filing something.
export default function PlacementSelects({
  album,
  isAlbum,
  onChange,
  section,
  username,
}: {
  album: string;
  // The row being edited is itself an album: it picks a parent section, and has
  // no album of its own to sit in.
  isAlbum?: boolean;
  // `hidden` is whether the container being filed into is itself hidden — the
  // composer starts a post that way, an existing page ignores it and keeps
  // whatever its own checkbox says.
  onChange: (placement: { section: string; album: string; hidden: boolean }) => void;
  section: string;
  username: string;
}) {
  const intl = useIntl();
  const queryClient = useQueryClient();
  const siteMap = useSiteMap(username);
  const [creating, setCreating] = useState<'section' | 'album' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const items = siteMap.data || [];
  const isTopLevel = section === 'main';
  // Where the page already sits is always one of the choices, even before the
  // sitemap has arrived — a select whose value has no option falls back to the
  // first one, which would quietly claim the page is top-level when it isn't.
  const sections = withCurrent(sectionsOf(items), isTopLevel ? '' : section);
  const albums = withCurrent(albumsOf(items, section), album);

  const createMutation = useMutation({
    mutationFn: (json: { kind: 'section' | 'album'; title: string; section?: string }) =>
      rpc.api.content.container.$post({ json }).then(async (r) => ({ ok: r.ok, body: await r.json() })),
  });

  // Picking "+ new" is a request, not a placement. React re-renders a controlled
  // select only when its value prop changes, and this one's hasn't, so the
  // sentinel would sit there selected behind the dialog: put the select back by
  // hand before opening it.
  const openDialog = (select: HTMLSelectElement, kind: 'section' | 'album') => {
    select.value = kind === 'section' ? section : album;
    setCreating(kind);
  };

  // Moving an album is moving its marker: under a section it stays an album,
  // and sent to main it becomes a section in its own right.
  const place = (nextSection: string, nextAlbum: string, hidden?: boolean) => {
    const target = nextAlbum
      ? items.find((item) => item.album === 'main' && item.name === nextAlbum)
      : items.find((item) => item.name === nextSection);
    onChange({
      section: nextSection,
      album: isAlbum ? (nextSection === 'main' ? '' : 'main') : nextAlbum,
      // A container created a moment ago says so itself: `items` here still
      // holds the render before it was written into the cache.
      hidden: hidden ?? !!target?.hidden,
    });
  };

  const handleCreate = async (title: string) => {
    const kind = creating!;
    setError(null);

    let result;
    try {
      // A section has no parent to name; an album hangs off the one showing.
      result = await createMutation.mutateAsync(kind === 'album' ? { kind, title, section } : { kind, title });
    } catch {
      result = null;
    }

    if (!result?.ok) {
      const code = (result?.body as { error?: string } | undefined)?.error || '';
      setError(intl.formatMessage(messages[CREATE_ERRORS[code] || 'error']));
      return;
    }

    const created = result.body as Created;
    queryClient.setQueryData(['sitemap', username], (old: SiteMapItem[] | undefined) =>
      withCreated(old || [], created)
    );
    queryClient.invalidateQueries({ queryKey: ['sitemap'] });
    setCreating(null);
    // Making a place to put something is how you say that is where it goes.
    place(kind === 'section' ? created.name : created.section, kind === 'section' ? '' : created.name, created.hidden);
  };

  return (
    <div className={styles.placement}>
      <select
        className={`${styles.placementSelect} notranslate`}
        aria-label={intl.formatMessage(messages.section)}
        disabled={siteMap.isPending}
        value={section}
        onChange={(evt) => (evt.target.value === NEW ? openDialog(evt.target, 'section') : place(evt.target.value, ''))}
      >
        <option value="main">{intl.formatMessage(messages.topLevel)}</option>
        {sections.map((item) => (
          <option key={item.name} value={item.name}>
            {item.title || item.name}
          </option>
        ))}
        <option value={NEW}>{intl.formatMessage(messages.newSection)}</option>
      </select>

      {isAlbum ? null : (
        <select
          className={`${styles.placementSelect} notranslate`}
          aria-label={intl.formatMessage(messages.album)}
          // Nothing sits directly under main except top-level pages, so there is
          // no album to choose until a section has been picked.
          disabled={siteMap.isPending || isTopLevel}
          value={album}
          onChange={(evt) =>
            evt.target.value === NEW ? openDialog(evt.target, 'album') : place(section, evt.target.value)
          }
        >
          <option value="">{intl.formatMessage(messages.noAlbum)}</option>
          {albums.map((item) => (
            <option key={item.name} value={item.name}>
              {item.title || item.name}
            </option>
          ))}
          {isTopLevel ? null : <option value={NEW}>{intl.formatMessage(messages.newAlbum)}</option>}
        </select>
      )}

      {creating ? (
        <NameDialog
          error={error}
          heading={creating === 'section' ? <F defaultMessage="New section" /> : <F defaultMessage="New album" />}
          isPending={createMutation.isPending}
          label={creating === 'section' ? <F defaultMessage="section" /> : <F defaultMessage="album" />}
          placeholder={intl.formatMessage(creating === 'section' ? messages.sectionName : messages.albumName)}
          onCancel={() => {
            setCreating(null);
            setError(null);
          }}
          onSubmit={handleCreate}
        />
      ) : null}
    </div>
  );
}
