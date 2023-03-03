import { Suspense, lazy, memo, useEffect, useState } from 'react';

import Help from './Help';
import { styled } from '@mui/material/styles';

const Debug = lazy(() => import('components/internal/Debug'));

const StyledFooter = styled('footer')`
  position: fixed;
  bottom: ${(props) => props.theme.spacing(1)};
  right: ${(props) => props.theme.spacing(2.5)}; // Swipeable drawer width.

  & button {
    margin-left: ${(props) => props.theme.spacing(1)};
  }
`;

// NB: we memoize here because it has the a11y script included on dev which is expensive.
const Footer = memo(function Footer() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <StyledFooter>
      {process.env.NODE_ENV === 'development' && isLoaded && (
        <>
          <Suspense fallback={<span />}>
            <Debug />
          </Suspense>
          <Help />
        </>
      )}
    </StyledFooter>
  );
});
export default Footer;
