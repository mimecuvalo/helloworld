import { type ReactNode, useCallback, useEffect, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { F, defineMessages, useIntl } from 'i18n';
import { rpc } from 'lib/rpc';
import { useEditor } from 'lib/editor-context';
import Editor from 'components/editor/Editor';
import { reblog, unfurl } from './util';
import editorStyles from 'components/editor/editor.module.css';
import styles from './dashboard.module.css';

const messages = defineMessages({
  posted: { defaultMessage: 'Success!' },
  error: { defaultMessage: 'Error posting content.' },
});

type SiteMapItem = {
  username: string;
  section: string;
  album: string;
  name: string;
  title?: string | null;
  hidden?: boolean | null;
};

export default function DashboardEditor({ username }: { username: string }) {
  const { editor } = useEditor();
  const intl = useIntl();
  const [contentThumb, setContentThumb] = useState('');
  const [sectionAndAlbum, setSectionAndAlbum] = useState('');
  const [editorValue, setEditorValue] = useState('');
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [editorKey, setEditorKey] = useState(0);

  const siteMap = useQuery({
    queryKey: ['sitemap', username],
    queryFn: async () => {
      const res = await rpc.api.content.sitemap.$get({ query: { username } });
      if (!res.ok) throw new Error('sitemap failed');
      return (await res.json()) as SiteMapItem[];
    },
  });

  const postMutation = useMutation({
    mutationFn: (json: {
      section: string;
      album: string;
      name: string;
      title: string;
      hidden: boolean;
      thumb: string;
      style: string;
      code: string;
      view: string;
    }) =>
      rpc.api.content.post.$post({ json }).then((r) => {
        if (!r.ok) throw new Error('post failed');
        return r.json();
      }),
  });

  // Default the section/album to the first sitemap entry (or a saved cookie).
  useEffect(() => {
    const saved = document.cookie.match(/(?:^|; )sectionAndAlbum=([^;]+)/)?.[1];
    if (saved) setSectionAndAlbum(decodeURIComponent(saved));
    else if (siteMap.data?.[0])
      setSectionAndAlbum(JSON.stringify({ section: siteMap.data[0].name, album: '', hidden: false }));
  }, [siteMap.data]);

  // Reblog bookmarklet deep-link: #reblog=<url>&img=<img>.
  useEffect(() => {
    if (editor && window.location.hash.startsWith('#reblog')) {
      const params = new URLSearchParams(window.location.hash.slice(1));
      const url = params.get('reblog') || '';
      reblog(editor, params.get('img') || url, url);
      window.location.hash = '';
    }
  }, [editor]);

  const handlePost = async () => {
    const title = (
      editorValue.match(/<h1>(.*?)<\/h1>/)?.[1] ||
      editorValue.split('</p>')[0].split('\n')[0].trim() ||
      ''
    ).replace(/<[^>]*>?/g, '');
    const name = title.replace(/[^A-Za-z0-9-]/g, '-').toLowerCase();
    const { section, album, hidden } = JSON.parse(sectionAndAlbum || '{"section":"main","album":"","hidden":false}');

    try {
      await postMutation.mutateAsync({
        section,
        album,
        name,
        title,
        hidden,
        thumb: contentThumb || '',
        style: '',
        code: '',
        view: editorValue,
      });
    } catch {
      setToast({ msg: intl.formatMessage(messages.error), ok: false });
      return;
    }
    setContentThumb('');
    setEditorValue('');
    setEditorKey((k) => k + 1);
    setToast({ msg: intl.formatMessage(messages.posted), ok: true });
  };

  const handlePaste = useCallback(
    async (text: string) => {
      if (!(text.match(/^https?:\/\//) || text.match(/^<iframe /))) return;
      const info = await unfurl(text);
      if (!info.wasMediaFound) return;
      if (info.isError) {
        setToast({ msg: intl.formatMessage(messages.error), ok: false });
        return;
      }
      if (info.image) setContentThumb(info.image);
      setEditorValue(`<h1>${info.title}</h1><br><br>${info.result}<br><br><a href="${text}">${text}</a>`);
    },
    [intl]
  );

  const handleChange = useCallback((_name: string, value: string) => setEditorValue(value), []);
  const handleMediaAdd = useCallback((url: string) => setContentThumb(url), []);
  const handleSectionChange = (value: string) => {
    setSectionAndAlbum(value);
    document.cookie = `sectionAndAlbum=${encodeURIComponent(value)};path=/;max-age=31536000`;
  };

  const isSitemapLoading = siteMap.isPending || !siteMap.data;

  const options = isSitemapLoading ? [] : buildSectionOptions(siteMap.data);
  const parsed = sectionAndAlbum ? JSON.parse(sectionAndAlbum) : { section: 'main', album: '' };

  return (
    <div className={styles.composer}>
      {!!options.length && (
        <div className={styles.composerToolbar}>
          <select
            className="notranslate"
            value={sectionAndAlbum}
            onChange={(e) => handleSectionChange(e.target.value)}
            aria-label="section & album"
          >
            {options}
          </select>
          <button type="button" className="btn" onClick={handlePost}>
            <F defaultMessage="post" />
          </button>
        </div>
      )}
      <Editor
        key={`dashboard-editor-${editorKey}`}
        name="dashboard-editor"
        section={parsed.section}
        album={parsed.album}
        defaultValue={editorValue}
        placeholder="Once upon a time, in cafe, far, far away."
        onChange={handleChange}
        onMediaAdd={handleMediaAdd}
        onPaste={handlePaste}
      />
      {toast ? (
        <div
          className={`${editorStyles.toast} ${toast.ok ? editorStyles.toastSuccess : editorStyles.toastError} notranslate`}
          role="alert"
          onClick={() => setToast(null)}
        >
          {toast.msg}
        </div>
      ) : null}
    </div>
  );
}

function buildSectionOptions(siteMap: SiteMapItem[]): ReactNode[] {
  const out: ReactNode[] = [];
  for (let i = 0; i < siteMap.length; ++i) {
    const item = siteMap[i];
    out.push(
      <option
        key={`${item.section}/${item.name}`}
        value={JSON.stringify({ section: item.name, album: '', hidden: item.hidden })}
      >
        {item.title}
      </option>
    );
    const next = siteMap[i + 1];
    if (next?.album === 'main') {
      for (i += 1; i < siteMap.length; ++i) {
        const albumItem = siteMap[i];
        if (albumItem.album === 'main') {
          out.push(
            <option
              key={`${item.name}/${albumItem.name}`}
              value={JSON.stringify({ section: item.name, album: albumItem.name, hidden: albumItem.hidden })}
            >
              &nbsp;&nbsp;&nbsp;{albumItem.title}
            </option>
          );
        } else {
          i -= 1;
          break;
        }
      }
    }
  }
  return out;
}
