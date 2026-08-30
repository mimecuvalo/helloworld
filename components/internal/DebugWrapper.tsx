import { Suspense, lazy, memo, useEffect, useState } from 'react';
import Help from './Help';
import styles from './dev.module.css';

// The a11y audit is expensive, so the Debug tray is dev-only and lazy-loaded.
// The DEV check has to gate the import() itself rather than the render: a guard
// further down still leaves the chunk — axe-core, 1.2MB — sitting in the
// production server function, since the bundler can't prove a dynamic import
// unreachable from a runtime branch. `import.meta.env.DEV` folds to `false` in
// the prod build, so this whole branch is dropped instead.
const Debug = import.meta.env.DEV ? lazy(() => import('./Debug')) : null;

const DebugWrapper = memo(function DebugWrapper() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  if (!isLoaded || !Debug) return null;

  return (
    <div className={styles.wrapper}>
      <Suspense fallback={<span />}>
        <Debug />
      </Suspense>
      <Help />
    </div>
  );
});

export default DebugWrapper;
