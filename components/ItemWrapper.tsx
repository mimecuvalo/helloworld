import { ReactNode } from 'react';
import { styled } from '@mui/material/styles';

const StyledItemWrapper = styled('div', { label: 'ItemWrapper' })`
  padding-bottom: 0;

  & .hw-item {
    align-items: stretch;
  }

  & header {
    margin-bottom: ${(props) => props.theme.spacing(1)};
  }

  & footer {
    margin-top: ${(props) => props.theme.spacing(1)};
  }
  // Hello, world code specific above ^

  // HTML Normalization below, used for Content and ContentRemote
  & p {
    margin-block: ${(props) => props.theme.spacing(0.5)};
    margin-inline: 0;
  }

  & ul,
  & ol,
  & blockquote {
    margin-block: ${(props) => props.theme.spacing(0.5)};
    margin-inline: 0;
    padding-left: ${(props) => props.theme.spacing(2)};
  }

  ${(props) => props.theme.breakpoints.down('sm')} {
    & ul,
    & ol,
    & blockquote {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-around;

      li {
        flex: 0 0 40%;
      }
    }
  }

  & blockquote {
    border-left: 1px solid ${(props) => props.theme.palette.secondary.main};
  }

  & a {
    word-wrap: break-word;
  }

  & pre {
    white-space: pre-wrap;
    word-wrap: break-word;
  }

  & figure {
    margin-block-start: 0;
    margin-block-end: 0;
    margin-inline-start: 0;
    margin-inline-end: 0;
  }

  & iframe,
  & object,
  & embed {
    max-width: calc(100% + 16px);
    margin: ${(props) => props.theme.spacing(0, -1)};
    height: 100%;
    aspect-ratio: 1.777;
  }

  & img {
    max-width: calc(100% + 16px);
    margin: ${(props) => props.theme.spacing(0, -1)};
  }

  & img:not([alt='thumbnail']) {
    max-height: calc(100vh - 50px);
    height: auto;
  }

  ${(props) => props.theme.breakpoints.down('md')} {
    & img,
    & iframe,
    & object,
    & embed {
      max-height: 82vh;
      max-width: calc(100% + ${(props) => props.theme.spacing(2)});
      margin: ${(props) => props.theme.spacing(0, -1)};
    }
  }
`;

export default function ItemWrapper({
  children,
  className,
  ref,
}: {
  children: ReactNode;
  className?: string;
  ref?: React.Ref<HTMLDivElement>;
}) {
  return (
    <StyledItemWrapper ref={ref} className={className}>
      {children}
    </StyledItemWrapper>
  );
}
