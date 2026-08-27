import { Editor } from '@tiptap/react';
import { insertUnfurl } from 'components/editor/unfurl';

export async function reblog(editor: Editor, imageOrText: string, url?: string) {
  if (!editor) return;

  editor.commands.setTextSelection(editor.state.doc.content.size);
  await insertUnfurl(editor, imageOrText, url);
}
