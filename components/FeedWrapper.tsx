import { styled } from '@mui/material/styles';

const FeedWrapper = styled('div', { label: 'FeedWrapper' })`
  width: 100%;
  border: 1px solid ${(props) => props.theme.palette.primary.light};
  box-shadow:
    1px 1px ${(props) => props.theme.palette.primary.light},
    2px 2px ${(props) => props.theme.palette.primary.light},
    3px 3px ${(props) => props.theme.palette.primary.light};
  transition: box-shadow 100ms;
  margin-bottom: ${(props) => props.theme.spacing(4)};
  clear: both;

  ${(props) => props.theme.breakpoints.down('md')} {
    width: 100%;
  }

  // ItemWrapper
  & > div {
    max-height: 75vh;
    height: 100%;
    overflow-y: scroll;
  }

  & .hw-item p {
    margin-block: 0;
  }

  & img:not([alt='thumbnail']) {
    max-height: none;
  }

  && header {
    height: auto;
    border: 0;
    border-bottom: 1px solid ${(props) => props.theme.palette.primary.light};
    box-shadow: none;
    margin-bottom: 0;
  }

  && footer {
    bottom: 0;
    border: 0;
    border-top: 1px solid ${(props) => props.theme.palette.primary.light};
    box-shadow: none;
    margin-top: 0;
    margin-bottom: 0;
  }
`;

export default FeedWrapper;
