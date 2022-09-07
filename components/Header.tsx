import LoginLogoutButton from 'components/login';
import { styled } from '@mui/material/styles';

const LoginWrapper = styled('div')`
  position: fixed;
  top: 10px;
  right: 10px;
`;

export default function Header() {
  return (
    <header>
      <LoginWrapper>
        <LoginLogoutButton />
      </LoginWrapper>
    </header>
  );
}
