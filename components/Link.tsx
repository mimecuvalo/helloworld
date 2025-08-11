import { Link as MuiLink, LinkProps as MuiLinkProps } from '@mui/material';

// TODO: Next.js's Link doesn't seem to work with view transitions.
const Link: React.FC<MuiLinkProps> = ({ children, target, ...props }) => (
  <MuiLink underline="hover" target={target} rel={target === '_blank' ? 'noopener noreferrer' : undefined} {...props}>
    {children}
  </MuiLink>
);

export default Link;
