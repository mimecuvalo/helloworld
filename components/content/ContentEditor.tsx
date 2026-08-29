import { useCallback, useEffect, useState } from 'react';
import { useRouter } from '@tanstack/react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { F, defineMessages, useIntl } from 'i18n';
import { rpc } from 'lib/rpc';
import { useEditableContent, type EditableContent } from 'lib/content-queries';
import { contentUrl } from 'lib/url-factory';
import { useEditor } from 'lib/editor-context';
import { formatHTML } from 'util/format-html';
import Editor from '../editor/Editor';
import TabbedEditor, { type Tab } from '../editor/TabbedEditor';
import PlacementSelects from '../editor/PlacementSelects';
import EditorOptions, { type ContentOptions } from './EditorOptions';
import editorStyles from '../editor/editor.module.css';

type EditableContentProps = {
  username: string;
  name: string;
  section: string;
  album: string;
  title: string;
  hidden: boolean;
  view: string;
};

type Draft = ContentOptions & {
  view: string;
  style: string;
  code: string;
  // Once the title has been typed by hand it stops tracking the body's heading.
  titleTouched: boolean;
};

const messages = defineMessages({
  posted: { defaultMessage: 'Success!' },
  error: { defaultMessage: 'Error saving content.' },
  duplicateName: { defaultMessage: 'Something else already has that name.' },
  reservedName: { defaultMessage: "That name is reserved; it can't be used." },
  structuralName: { defaultMessage: "That page's name is what the site navigates by, so it can't be renamed." },
  cannotNestSection: { defaultMessage: 'A top-level section has nowhere to move to.' },
  deleteError: { defaultMessage: 'Error deleting content.' },
});

const SAVE_ERRORS: Record<string, keyof typeof messages> = {
  'duplicate-name': 'duplicateName',
  'reserved-name': 'reservedName',
  'structural-name': 'structuralName',
  'cannot-nest-section': 'cannotNestSection',
};

// The body's own <h1> doubles as the title when nobody has set one by hand —
// that's how posts written straight into the wysiwyg get named. Scraping the
// first paragraph is a last resort for untitled content only: it used to run
// ahead of `fallback`, so editing the body of an already-named page that had no
// <h1> would quietly rename it to its opening line.
function deriveTitle(view: string, fallback: string) {
  const strip = (s: string) => s.replace(/<[^>]*>?/g, '');
  const heading = view.match(/<h1>(.*?)<\/h1>/)?.[1];
  if (heading) return strip(heading);
  if (fallback) return fallback;
  return strip(view.split('</p>')[0].split('\n')[0].trim());
}

function toDraft(editable: EditableContent): Draft {
  return {
    title: editable.title || '',
    name: editable.name,
    section: editable.section,
    album: editable.album,
    template: editable.template || '',
    thumb: editable.thumb || '',
    lqip: editable.lqip ?? null,
    hidden: !!editable.hidden,
    view: editable.view || '',
    style: editable.style || '',
    code: editable.code || '',
    titleTouched: false,
  };
}

export default function ContentEditor({ content }: { content: EditableContentProps }) {
  const [wasEditing, setWasEditing] = useState(false);
  const { isEditing, setIsEditing } = useEditor();
  const [tab, setTab] = useState<Tab>('content');
  // Seeded from the row as it is stored, not as it is served: fetchContent folds
  // the section's and album's css/js into what the page renders.
  const [draft, setDraft] = useState<Draft | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const intl = useIntl();
  const router = useRouter();
  const queryClient = useQueryClient();
  const editable = useEditableContent(content.name, isEditing);

  const saveMutation = useMutation({
    mutationFn: (json: {
      name: string;
      newName: string;
      title: string;
      hidden: boolean;
      section: string;
      album: string;
      template: string;
      thumb: string;
      lqip: number | null;
      style: string;
      code: string;
      view: string;
    }) => rpc.api.content.save.$post({ json }).then(async (r) => ({ ok: r.ok, body: await r.json() })),
  });

  const deleteMutation = useMutation({
    mutationFn: (name: string) =>
      rpc.api.content.delete.$post({ json: { name } }).then((r) => {
        if (!r.ok) throw new Error('delete failed');
        return r.json();
      }),
  });

  useEffect(() => {
    const handleOnBeforeUnload = (evt: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) evt.returnValue = 'You have unfinished changes!';
    };
    window.addEventListener('beforeunload', handleOnBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleOnBeforeUnload);
  }, [hasUnsavedChanges]);

  useEffect(() => {
    if (isEditing) setWasEditing(true);
  }, [isEditing]);

  useEffect(() => {
    if (editable.data && !draft) setDraft(toDraft(editable.data));
  }, [editable.data, draft]);

  useEffect(() => {
    const save = async (values: Draft) => {
      // Derived from the wysiwyg's own output rather than the formatted copy: the
      // fallback below reads the first line, and formatting is what puts lines in.
      const title = values.titleTouched ? values.title : deriveTitle(values.view, values.title || content.title);
      // Stored pretty-printed so the HTML tab is readable next time it's opened.
      const view = formatHTML(values.view);

      let result;
      try {
        result = await saveMutation.mutateAsync({
          name: content.name,
          newName: values.name,
          title,
          hidden: values.hidden,
          section: values.section,
          album: values.album,
          template: values.template,
          thumb: values.thumb,
          lqip: values.lqip,
          style: values.style,
          code: values.code,
          view,
        });
      } catch {
        result = null;
      }

      const failure = !result?.ok
        ? messages[SAVE_ERRORS[(result?.body as { error?: string } | undefined)?.error || ''] || 'error']
        : null;
      if (failure) {
        setToast({ msg: intl.formatMessage(failure), ok: false });
        setIsEditing(true);
        return;
      }

      setToast({ msg: intl.formatMessage(messages.posted), ok: true });
      setHasUnsavedChanges(false);
      setDraft(null);
      queryClient.removeQueries({ queryKey: ['editable', content.name] });
      queryClient.invalidateQueries({ queryKey: ['sitemap'] });
      queryClient.invalidateQueries({ queryKey: ['collection'] });

      // A rename or a move puts the page at a different url, and the router is
      // still sitting on the old one.
      const saved = result?.body as { username: string; section: string; album: string; name: string } | undefined;
      if (
        saved &&
        (saved.name !== content.name || saved.section !== content.section || saved.album !== content.album)
      ) {
        router.navigate({ to: contentUrl(saved), replace: true });
      } else {
        router.invalidate();
      }
    };

    if (wasEditing && !isEditing) {
      setWasEditing(false);
      if (draft) save(draft);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing, wasEditing]);

  const patch = useCallback((values: Partial<Draft>) => {
    setDraft((current) => (current ? { ...current, ...values } : current));
    setHasUnsavedChanges(true);
  }, []);

  const handleOptionsChange = useCallback(
    (values: Partial<ContentOptions>) => patch('title' in values ? { ...values, titleTouched: true } : values),
    [patch]
  );
  // Moving a page doesn't change whether it is hidden; that stays its own.
  const handlePlacementChange = useCallback(
    ({ section, album }: { section: string; album: string }) => patch({ section, album }),
    [patch]
  );
  const handleEditorChange = useCallback((_name: string, value: string) => patch({ view: value }), [patch]);
  const handleHtmlChange = useCallback((value: string) => patch({ view: value }), [patch]);
  const handleStyleChange = useCallback((value: string) => patch({ style: value }), [patch]);
  const handleCodeChange = useCallback((value: string) => patch({ code: value }), [patch]);

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(content.name);
    } catch {
      setToast({ msg: intl.formatMessage(messages.deleteError), ok: false });
      return;
    }
    setHasUnsavedChanges(false);
    setDraft(null);
    setWasEditing(false);
    setIsEditing(false);
    queryClient.invalidateQueries({ queryKey: ['sitemap'] });
    queryClient.invalidateQueries({ queryKey: ['collection'] });
    router.navigate({ to: `/${content.username}`, replace: true });
  };

  return (
    <>
      {isEditing ? (
        <TabbedEditor
          tab={tab}
          onTabChange={setTab}
          isPending={!draft}
          view={draft?.view || ''}
          style={draft?.style || ''}
          code={draft?.code || ''}
          onViewChange={handleHtmlChange}
          onStyleChange={handleStyleChange}
          onCodeChange={handleCodeChange}
          placement={
            // A section is already as high as it goes, so it has nowhere to be
            // filed; everything else picks its spot right here in the strip.
            draft && content.section !== 'main' ? (
              <PlacementSelects
                username={content.username}
                isAlbum={content.album === 'main'}
                section={draft.section}
                album={draft.album}
                onChange={handlePlacementChange}
              />
            ) : null
          }
          content={
            <Editor
              name="content-editor"
              section={draft?.section || content.section}
              album={draft?.album || content.album}
              defaultValue={draft?.view || ''}
              onChange={handleEditorChange}
            />
          }
          options={
            draft ? (
              <EditorOptions
                isSection={content.section === 'main'}
                isAlbum={content.album === 'main'}
                isDeleting={deleteMutation.isPending}
                values={draft}
                onChange={handleOptionsChange}
                onDelete={handleDelete}
              />
            ) : null
          }
          footer={
            tab !== 'content' && tab !== 'options' && (content.section === 'main' || content.album === 'main') ? (
              <p className={editorStyles.optionHint}>
                <F defaultMessage="Styling and code added here apply to everything inside this section or album too." />
              </p>
            ) : null
          }
        />
      ) : null}
      {toast ? (
        <div
          className={`${editorStyles.toast} ${toast.ok ? editorStyles.toastSuccess : editorStyles.toastError} notranslate`}
          role="alert"
          onClick={() => setToast(null)}
        >
          {toast.msg}
        </div>
      ) : null}
    </>
  );
}
