import { ForwardedRef, forwardRef } from 'react';
import { Link as MuiLink, LinkProps as MuiLinkProps } from '@mui/material';
import NextLink, { LinkProps } from 'next/link';

const BaseLink: React.FC<MuiLinkProps & LinkProps> = forwardRef(
  ({ children, as, href, shallow, target, ...props }, ref) => (
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
  )
);
BaseLink.displayName = 'BaseLink';

// @ts-ignore
const Link = forwardRef(function ForwardedLink(props: MuiLinkProps & LinkProps, ref: ForwardedRef<typeof Link>) {
  return <BaseLink ref={ref} {...props} />;
});

export default Link;
