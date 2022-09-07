import { Suspense, lazy, memo, useEffect, useState } from 'react';

import Help from './Help';
import { styled } from '@mui/material/styles';
const Debug = lazy(() => import('components/internal/Debug'));

const StyledFooter = styled('footer')`
  position: fixed;
  bottom: 0;
  right: 0;

  & button {
    margin-left: 10px;
  }
`;

// NB: we memoize here because it has the a11y script included on dev which is expensive.
const Footer = memo(function Footer() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(false);
  }, []);

  return (
    <StyledFooter>
      {process.env.NODE_ENV === 'development' && isLoaded && (
        <Suspense fallback={<span />}>
          <Debug />
        </Suspense>
      )}
      <Help />
    </StyledFooter>
  );
});
export default Footer;
