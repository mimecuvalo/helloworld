import { createContext, useContext, useState, type ReactNode } from 'react';
import type { Editor } from '@tiptap/react';

// What the editor just handed off to the server, kept until the router has the
// saved row. The page underneath is still rendering the copy it loaded before
// the edit, so without this the words that were just typed disappear for as
// long as the request takes and then come back — which reads as a lost edit.
export interface PendingContent {
  username: string;
  name: string;
  title: string;
  view: string;
}

interface EditorContextState {
  editor: Editor | null;
  setEditor: (editor: Editor | null) => void;
  isEditing: boolean;
  setIsEditing: (isEditing: boolean) => void;
  pending: PendingContent | null;
  setPending: (pending: PendingContent | null) => void;
}

const EditorContext = createContext<EditorContextState>({} as EditorContextState);

export function useEditor() {
  return useContext(EditorContext);
}

// Keyed by the row it came from: a feed, and a `latest` page, render rows that
// aren't the one being edited through these same components.
export function usePendingContent(content: { username: string; name: string }) {
  const { pending } = useEditor();
  return pending && pending.username === content.username && pending.name === content.name ? pending : null;
}

export function EditorProvider({ children }: { children: ReactNode }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [pending, setPending] = useState<PendingContent | null>(null);
  return (
    <EditorContext.Provider value={{ isEditing, setIsEditing, editor, setEditor, pending, setPending }}>
      {children}
    </EditorContext.Provider>
  );
}
