import { useEffect, useState } from 'react';
import { useRouter } from '@tanstack/react-router';
import { contentUrl } from 'lib/url-factory';
import { useCollectionLatest } from 'lib/content-queries';
import Archive from './Archive';
import Simple from './Simple';

type LatestContent = {
  username: string;
  section: string;
  album: string;
  name: string;
  forceRefresh?: boolean | null;
};

export default function Latest({ content }: { content: LatestContent }) {
  const { username, section, name } = content;
  const router = useRouter();
  const [archiveMode, setArchiveMode] = useState(false);
  const { data, isPending } = useCollectionLatest({ username, section, name });

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get('mode') === 'archive') {
      setArchiveMode(true);
    } else if (data) {
      // XXX(mime): we do setTimeout 0 because in Content.js we replace history
      // with the canonical url so it's a shitty race condition :-/
      setTimeout(() => router.navigate({ to: contentUrl(data), replace: true }), 0);
    }
  }, [data, router]);

  if (archiveMode) return <Archive content={content} />;
  if (isPending || !data) return null;
  return <Simple content={data} />;
}
