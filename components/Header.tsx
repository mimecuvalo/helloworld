import Login from './Login';
import { styled } from '@mui/material';

const StyledHeader = styled('header')`
  position: fixed;
  top: ${(props) => props.theme.spacing(1)};
  right: ${(props) => props.theme.spacing(1)};
  display: block;

  ${(props) => props.theme.breakpoints.down('md')} {
    display: none;
  }
`;

export default function Header() {
  return (
    <StyledHeader>
      <nav>
        <Login />
      </nav>
    </StyledHeader>
  );
}
