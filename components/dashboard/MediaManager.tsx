import { useMemo, useState } from 'react';
import { Dialog } from '@base-ui/react/dialog';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { F, defineMessages, useIntl } from 'i18n';
import { rpc } from 'lib/rpc';
import styles from './dashboard.module.css';

const messages = defineMessages({
  select: { defaultMessage: 'select {name}' },
  open: { defaultMessage: 'open the full size in a new tab' },
});

type MediaAsset = {
  name: string;
  keys: string[];
  original: string | null;
  medium: string | null;
  thumb: string | null;
  size: number;
  lastModified: string | null;
  url: string;
  previewUrl: string;
  isImage: boolean;
};

type MediaListing = {
  prefix: string;
  folders: { prefix: string; name: string }[];
  assets: MediaAsset[];
  truncated: boolean;
};

type MediaUsage = { key: string; posts: { name: string; title: string }[] };

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let size = bytes / 1024;
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit++;
  }
  return `${size < 10 ? size.toFixed(1) : Math.round(size)} ${units[unit]}`;
}

// The upload names a file `<timestamp>-<original name>`, which is what makes a
// key unique but is not what the author called the picture.
function displayName(name: string) {
  return name.replace(/^\d{10,}-/, '');
}

const extensionOf = (name: string) => name.slice(name.lastIndexOf('.') + 1).toUpperCase();

export default function MediaManager({ username }: { username: string }) {
  const intl = useIntl();
  const queryClient = useQueryClient();
  const root = `${username}/`;
  const [prefix, setPrefix] = useState(root);
  // Asset names, which are unique within the folder being looked at. Cleared
  // whenever that folder changes, so there is never an invisible selection.
  const [selected, setSelected] = useState<string[]>([]);
  const [confirming, setConfirming] = useState(false);
  const [copied, setCopied] = useState('');
  const [error, setError] = useState('');

  const listing = useQuery({
    queryKey: ['media', prefix],
    queryFn: () =>
      rpc.api.media.list.$get({ query: { prefix } }).then(async (response) => {
        if (!response.ok) throw new Error(((await response.json()) as { error?: string }).error || '');
        return response.json() as Promise<MediaListing>;
      }),
  });

  const assets = useMemo(() => listing.data?.assets || [], [listing.data]);
  const selectedAssets = useMemo(() => assets.filter((asset) => selected.includes(asset.name)), [assets, selected]);
  const selectedKeys = useMemo(() => selectedAssets.flatMap((asset) => asset.keys), [selectedAssets]);
  const selectedBytes = selectedAssets.reduce((total, asset) => total + asset.size, 0);

  // Only asked once the confirm dialog is actually open: it is a scan over the
  // author's posts, and it exists to answer a question nobody has asked yet.
  const usage = useQuery({
    queryKey: ['media-usage', selectedKeys],
    enabled: confirming && selectedKeys.length > 0,
    queryFn: () =>
      rpc.api.media.usage
        .$post({ json: { keys: selectedKeys } })
        .then((response) => response.json() as Promise<{ usage: MediaUsage[] }>),
  });

  // Which of the selected assets a post still points at, by asset name — an
  // asset is in use if any of its sizes is.
  const usedBy = useMemo(() => {
    const byAsset = new Map<string, { name: string; title: string }[]>();
    for (const asset of selectedAssets) {
      const posts = (usage.data?.usage || []).filter((row) => asset.keys.includes(row.key)).flatMap((row) => row.posts);
      // The same post can hold two sizes of the same picture.
      const unique = [...new Map(posts.map((post) => [post.name, post])).values()];
      if (unique.length) byAsset.set(asset.name, unique);
    }
    return byAsset;
  }, [selectedAssets, usage.data]);

  const remove = useMutation({
    mutationFn: () =>
      rpc.api.media.delete.$post({ json: { keys: selectedKeys } }).then(async (response) => {
        if (!response.ok) throw new Error(((await response.json()) as { error?: string }).error || '');
        return response.json() as Promise<{ deleted: string[]; errors: { key: string; message: string }[] }>;
      }),
    onSuccess: (result) => {
      setConfirming(false);
      setSelected([]);
      setError(
        result.errors.length ? `${result.errors.length} file(s) could not be deleted: ${result.errors[0].message}` : ''
      );
      queryClient.invalidateQueries({ queryKey: ['media', prefix] });
    },
    onError: (ex: Error) => setError(ex.message || 'Could not delete that.'),
  });

  const goTo = (next: string) => {
    setPrefix(next);
    setSelected([]);
    setError('');
  };

  const toggle = (name: string) =>
    setSelected((current) => (current.includes(name) ? current.filter((other) => other !== name) : [...current, name]));

  const copyUrl = async (asset: MediaAsset) => {
    await navigator.clipboard.writeText(asset.url);
    setCopied(asset.name);
    setTimeout(() => setCopied(''), 1500);
  };

  // `mime/photos/2024/` becomes a crumb per segment, each one a prefix to go to.
  const crumbs = prefix
    .replace(/\/$/, '')
    .split('/')
    .map((segment, index, all) => ({ segment, prefix: `${all.slice(0, index + 1).join('/')}/` }));

  return (
    <div className={styles.media}>
      <h2>
        <F defaultMessage="media manager" />
      </h2>
      <p className={styles.organizeHint}>
        <F defaultMessage="Everything you have uploaded, grouped by file — the full-size original, the copy your posts show, and the thumbnail all count as one thing here, and are deleted together." />
      </p>

      <nav className={styles.mediaCrumbs}>
        {crumbs.map((crumb, index) => (
          <span key={crumb.prefix}>
            {index > 0 ? <span aria-hidden="true"> / </span> : null}
            {crumb.prefix === prefix ? (
              <span className={`${styles.mediaCrumbCurrent} notranslate`}>{crumb.segment}</span>
            ) : (
              <button type="button" className={`${styles.mediaCrumb} notranslate`} onClick={() => goTo(crumb.prefix)}>
                {crumb.segment}
              </button>
            )}
          </span>
        ))}
      </nav>

      {error ? <p className={styles.dialogError}>{error}</p> : null}
      {listing.isError ? (
        <p className={styles.dialogError}>
          <F defaultMessage="Could not read the bucket. If this is new, the credentials may not be allowed to list it yet." />
        </p>
      ) : null}
      {listing.data?.truncated ? (
        <p className={styles.mediaNotice}>
          <F defaultMessage="This folder holds more files than can be shown at once. Only the first of them are listed." />
        </p>
      ) : null}

      {listing.data?.folders.length ? (
        <ul className={styles.mediaFolders}>
          {listing.data.folders.map((folder) => (
            <li key={folder.prefix}>
              <button type="button" className={styles.mediaFolder} onClick={() => goTo(folder.prefix)}>
                <span aria-hidden="true">📁</span> <span className="notranslate">{folder.name}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {listing.isPending ? (
        <p className={styles.organizeHint}>
          <F defaultMessage="Reading the bucket…" />
        </p>
      ) : null}

      {listing.data && !listing.data.folders.length && !assets.length ? (
        <p className={styles.organizeHint}>
          <F defaultMessage="There is nothing here." />
        </p>
      ) : null}

      {assets.length ? (
        <ul className={styles.mediaGrid}>
          {assets.map((asset) => {
            const isSelected = selected.includes(asset.name);
            return (
              <li key={asset.name} className={`${styles.mediaTile} ${isSelected ? styles.mediaTileSelected : ''}`}>
                <label className={styles.mediaTileSelect}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggle(asset.name)}
                    aria-label={intl.formatMessage(messages.select, { name: displayName(asset.name) })}
                  />
                </label>

                <a
                  href={asset.url}
                  target="_blank"
                  rel="noreferrer"
                  className={styles.mediaPreview}
                  title={intl.formatMessage(messages.open)}
                >
                  {asset.isImage ? (
                    <img src={asset.previewUrl} alt="" loading="lazy" />
                  ) : (
                    <span className={styles.mediaFileType}>{extensionOf(asset.name)}</span>
                  )}
                </a>

                <div className={styles.mediaMeta}>
                  <span className={`${styles.mediaName} notranslate`} title={asset.name}>
                    {displayName(asset.name)}
                  </span>
                  <span className={styles.mediaSize}>
                    {formatBytes(asset.size)}
                    {/* An image missing its `original/` predates the resizing
                        pipeline, which is worth being able to see at a glance. */}
                    {asset.isImage && !asset.original ? (
                      <>
                        {' · '}
                        <F defaultMessage="no original" />
                      </>
                    ) : null}
                  </span>
                  <button type="button" className={styles.mediaCopy} onClick={() => copyUrl(asset)}>
                    {copied === asset.name ? <F defaultMessage="copied" /> : <F defaultMessage="copy url" />}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}

      {selected.length ? (
        <div className={styles.mediaSelection}>
          <span>
            <F
              defaultMessage="{count, plural, one {# file} other {# files}} selected · {size}"
              values={{ count: selected.length, size: formatBytes(selectedBytes) }}
            />
          </span>
          <button type="button" className={styles.mediaClear} onClick={() => setSelected([])}>
            <F defaultMessage="clear" />
          </button>
          <button type="button" className={styles.mediaDelete} onClick={() => setConfirming(true)}>
            <F defaultMessage="delete" />
          </button>
        </div>
      ) : null}

      <Dialog.Root open={confirming} onOpenChange={setConfirming}>
        <Dialog.Portal>
          <Dialog.Backdrop className={styles.dialogBackdrop} />
          <Dialog.Popup className={styles.dialogPopup}>
            <Dialog.Title className={styles.dialogTitle}>
              <F defaultMessage="delete these files?" />
            </Dialog.Title>

            <p className={styles.organizeHint}>
              <F
                defaultMessage="{assets, plural, one {# file} other {# files}} — {keys, plural, one {# object} other {# objects}} in the bucket, {size}. This cannot be undone."
                values={{ assets: selected.length, keys: selectedKeys.length, size: formatBytes(selectedBytes) }}
              />
            </p>

            {usage.isPending && selectedKeys.length ? (
              <p className={styles.organizeHint}>
                <F defaultMessage="Checking whether anything still uses them…" />
              </p>
            ) : null}

            {usedBy.size ? (
              <div className={styles.mediaWarning}>
                <p>
                  <F
                    defaultMessage="⚠ {count, plural, one {# of these is} other {# of these are}} still used by posts. Deleting will leave a hole in them."
                    values={{ count: usedBy.size }}
                  />
                </p>
                <ul>
                  {[...usedBy.entries()].map(([name, posts]) => (
                    <li key={name}>
                      <span className="notranslate">{displayName(name)}</span>
                      {' — '}
                      <span className="notranslate">{posts.map((post) => post.title || post.name).join(', ')}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {usage.data && !usedBy.size ? (
              <p className={styles.mediaSafe}>
                <F defaultMessage="No post points at any of these." />
              </p>
            ) : null}

            <div className={styles.dialogActions}>
              <Dialog.Close type="button" className={styles.dialogButton}>
                <F defaultMessage="cancel" />
              </Dialog.Close>
              <button
                type="button"
                className={`${styles.dialogButton} ${styles.mediaDelete}`}
                disabled={remove.isPending}
                onClick={() => remove.mutate()}
              >
                {remove.isPending ? <F defaultMessage="deleting…" /> : <F defaultMessage="delete" />}
              </button>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
