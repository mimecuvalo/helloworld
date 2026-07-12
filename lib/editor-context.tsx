import { createContext, useContext, useState, type ReactNode } from 'react';
import type { Editor } from '@tiptap/react';

interface EditorContextState {
  editor: Editor | null;
  setEditor: (editor: Editor | null) => void;
  isEditing: boolean;
  setIsEditing: (isEditing: boolean) => void;
}

const EditorContext = createContext<EditorContextState>({} as EditorContextState);

export function useEditor() {
  return useContext(EditorContext);
}

export function EditorProvider({ children }: { children: ReactNode }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editor, setEditor] = useState<Editor | null>(null);
  return (
    <EditorContext.Provider value={{ isEditing, setIsEditing, editor, setEditor }}>{children}</EditorContext.Provider>
  );
}
