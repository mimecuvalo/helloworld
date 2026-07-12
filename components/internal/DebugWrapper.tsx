import { Suspense, lazy, memo, useEffect, useState } from 'react';
import Help from './Help';
import styles from './dev.module.css';

// The a11y audit is expensive, so the Debug tray is dev-only and lazy-loaded.
const Debug = lazy(() => import('./Debug'));

const DebugWrapper = memo(function DebugWrapper() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  if (!isLoaded) return null;

  return (
    <div className={styles.wrapper}>
      {import.meta.env.DEV && (
        <Suspense fallback={<span />}>
          <Debug />
        </Suspense>
      )}
      <Help />
    </div>
  );
});

export default DebugWrapper;
