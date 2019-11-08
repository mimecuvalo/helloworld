import { useEffect } from 'react';

export default function useDocumentTitle(title) {
  useEffect(() => {
    const originalTitle = document.title;
    document.title = title;

    return () => (document.title = originalTitle);
  }, [title]);
}
