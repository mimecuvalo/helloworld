import { useCallback, useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { F, defineMessages, useIntl } from 'i18n';
import { rpc } from 'lib/rpc';
import { useSiteMap } from 'lib/content-queries';
import { useEditor } from 'lib/editor-context';
import Editor from 'components/editor/Editor';
import TabbedEditor, { type Tab } from 'components/editor/TabbedEditor';
import PlacementSelects from 'components/editor/PlacementSelects';
import EditorOptions, { type ContentOptions } from 'components/content/EditorOptions';
import { reblog } from './util';
import editorStyles from 'components/editor/editor.module.css';
import styles from './dashboard.module.css';

const messages = defineMessages({
  posted: { defaultMessage: 'Success!' },
  error: { defaultMessage: 'Error posting content.' },
  duplicateName: { defaultMessage: 'Something else already has that name.' },
  reservedName: { defaultMessage: "That name is reserved; it can't be used." },
});

const POST_ERRORS: Record<string, keyof typeof messages> = {
  'duplicate-name': 'duplicateName',
  'reserved-name': 'reservedName',
};

type Draft = ContentOptions & { view: string; style: string; code: string; titleTouched: boolean };

const EMPTY: Draft = {
  title: '',
  name: '',
  section: 'main',
  album: '',
  template: '',
  thumb: '',
  hidden: false,
  view: '',
  style: '',
  code: '',
  titleTouched: false,
};

// The heading of what you just wrote is the post's title unless you say otherwise.
function deriveTitle(view: string) {
  return (view.match(/<h1>(.*?)<\/h1>/)?.[1] || view.split('</p>')[0].split('\n')[0].trim() || '').replace(
    /<[^>]*>?/g,
    ''
  );
}

export default function DashboardEditor({ username }: { username: string }) {
  const { editor } = useEditor();
  const intl = useIntl();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('content');
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  // Remounts the wysiwyg after a post, so it starts empty rather than holding
  // the text that was just published.
  const [editorKey, setEditorKey] = useState(0);
  const siteMap = useSiteMap(username);

  const postMutation = useMutation({
    mutationFn: (json: {
      section: string;
      album: string;
      name: string;
      title: string;
      hidden: boolean;
      thumb: string;
      template: string;
      style: string;
      code: string;
      view: string;
    }) => rpc.api.content.post.$post({ json }).then(async (r) => ({ ok: r.ok, body: await r.json() })),
  });

  // Default the section/album to the first sitemap entry (or a saved cookie).
  useEffect(() => {
    const saved = document.cookie.match(/(?:^|; )sectionAndAlbum=([^;]+)/)?.[1];
    if (saved) {
      const { section, album, hidden } = JSON.parse(decodeURIComponent(saved));
      setDraft((current) => ({ ...current, section, album: album || '', hidden: !!hidden }));
    } else if (siteMap.data?.[0]) {
      setDraft((current) => ({ ...current, section: siteMap.data[0].name, album: '' }));
    }
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

  const patch = useCallback((values: Partial<Draft>) => setDraft((current) => ({ ...current, ...values })), []);

  // Where you post to is a standing preference, so it outlives the post; filing
  // into a hidden section hides the post too, until the checkbox says otherwise.
  const handlePlacementChange = useCallback(
    ({ section, album, hidden }: { section: string; album: string; hidden: boolean }) => {
      document.cookie = `sectionAndAlbum=${encodeURIComponent(JSON.stringify({ section, album, hidden }))};path=/;max-age=31536000`;
      patch({ section, album, hidden });
    },
    [patch]
  );

  const handleOptionsChange = useCallback(
    (values: Partial<ContentOptions>) => patch('title' in values ? { ...values, titleTouched: true } : values),
    [patch]
  );

  const handleEditorChange = useCallback((_name: string, value: string) => patch({ view: value }), [patch]);
  const handleViewChange = useCallback((value: string) => patch({ view: value }), [patch]);
  const handleStyleChange = useCallback((value: string) => patch({ style: value }), [patch]);
  const handleCodeChange = useCallback((value: string) => patch({ code: value }), [patch]);
  // The first image dropped into a post becomes its thumbnail, unless one is set.
  const handleMediaAdd = useCallback(
    (url: string) => setDraft((current) => (current.thumb ? current : { ...current, thumb: url })),
    []
  );

  const handlePost = async () => {
    const title = draft.titleTouched ? draft.title : deriveTitle(draft.view);

    let result;
    try {
      result = await postMutation.mutateAsync({
        section: draft.section,
        album: draft.album,
        name: draft.name,
        title,
        hidden: draft.hidden,
        thumb: draft.thumb,
        template: draft.template,
        style: draft.style,
        code: draft.code,
        view: draft.view,
      });
    } catch {
      result = null;
    }

    if (!result?.ok) {
      const error = (result?.body as { error?: string } | undefined)?.error || '';
      setToast({ msg: intl.formatMessage(messages[POST_ERRORS[error] || 'error']), ok: false });
      return;
    }

    // Where you were posting to is a standing preference; everything else was
    // about the post that just went out.
    setDraft({ ...EMPTY, section: draft.section, album: draft.album, hidden: draft.hidden });
    setTab('content');
    setEditorKey((k) => k + 1);
    setToast({ msg: intl.formatMessage(messages.posted), ok: true });
    queryClient.invalidateQueries({ queryKey: ['collection'] });
  };

  return (
    <div className={styles.composer}>
      <TabbedEditor
        tab={tab}
        onTabChange={setTab}
        isPending={siteMap.isPending}
        view={draft.view}
        style={draft.style}
        code={draft.code}
        onViewChange={handleViewChange}
        onStyleChange={handleStyleChange}
        onCodeChange={handleCodeChange}
        placement={
          <PlacementSelects
            username={username}
            section={draft.section}
            album={draft.album}
            onChange={handlePlacementChange}
          />
        }
        actions={
          <button type="button" className="btn" disabled={postMutation.isPending} onClick={handlePost}>
            <F defaultMessage="post" />
          </button>
        }
        content={
          <Editor
            key={`dashboard-editor-${editorKey}`}
            name="dashboard-editor"
            section={draft.section}
            album={draft.album}
            defaultValue={draft.view}
            placeholder="Once upon a time, in cafe, far, far away."
            onChange={handleEditorChange}
            onMediaAdd={handleMediaAdd}
          />
        }
        options={<EditorOptions isSection={false} isAlbum={false} values={draft} onChange={handleOptionsChange} />}
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
