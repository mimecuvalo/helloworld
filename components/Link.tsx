import { Link as MuiLink, LinkProps as MuiLinkProps } from '@mui/material';
import NextLink, { LinkProps } from 'next/link';

const Link: React.FC<MuiLinkProps & LinkProps> = ({ children, as, href, shallow, target, ref, ...props }) => (
  <NextLink href={href || ''} as={as} shallow={shallow} passHref legacyBehavior>
    <MuiLink
      underline="hover"
      target={target}
      rel={target === '_blank' ? 'noopener noreferrer' : undefined}
      ref={ref}
      {...props}
    >
      {children}
    </MuiLink>
  </NextLink>
);

export default Link;
