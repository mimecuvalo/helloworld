import { createContext, useContext, useState } from 'react';
import { Editor } from '@tiptap/react';
interface ContextState {
  editor: Editor | null;
  setEditor: (editor: Editor | null) => void;
  isEditing: boolean;
  setIsEditing: (isEditing: boolean) => void;
}
export const EditorContext = createContext({} as ContextState);

export function useEditor() {
  return useContext(EditorContext);
}

export function EditorProvider({ children }: { children: React.ReactNode }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editor, setEditor] = useState<Editor | null>(null);
  return (
    <EditorContext.Provider value={{ isEditing, setIsEditing, editor, setEditor }}>{children}</EditorContext.Provider>
  );
}
