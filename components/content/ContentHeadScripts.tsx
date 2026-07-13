import { buildContentScripts } from 'lib/content-head';
import { useRouter } from '@tanstack/react-router';

// Renders the JSON-LD + Google Analytics scripts in the page body (not <head>).
// Keeping them out of the head avoids a hydration mismatch: we hydrate the whole
// document and Sentry injects <meta name="sentry-trace"> into <head>, which
// shifts position-sensitive head <script> tags. JSON-LD in the body is valid for
// crawlers and GA works the same.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function ContentHeadScripts(opts: { content: any; contentOwner: any; host: string; title: string }) {
  const router = useRouter();
  const nonce = router.options.ssr?.nonce;
  const scripts = buildContentScripts(opts);
  return (
    <>
      {scripts.map((s, i) =>
        s.children ? (
          <script
            key={i}
            nonce={nonce}
            type={s.type}
            suppressHydrationWarning
            dangerouslySetInnerHTML={{ __html: s.children }}
          />
        ) : s.src ? (
          <script key={i} nonce={nonce} src={s.src} async={s.async} suppressHydrationWarning />
        ) : null
      )}
    </>
  );
}
