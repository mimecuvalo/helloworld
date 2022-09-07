import { F } from 'i18n';
import Link from 'next/link';
import LoginLogoutButton from 'components/login';
import { styled } from '@mui/material/styles';

const List = styled('ul')`
  position: fixed;
  top: 10px;
  left: 10px;
`;

const LoginWrapper = styled('div')`
  position: fixed;
  top: 10px;
  right: 10px;
`;

export default function Header() {
  return (
    <header>
      <nav>
        <List>
          <li>
            <Link passHref href="/">
              <a>
                <F defaultMessage="Home" />
              </a>
            </Link>
          </li>
          <li>
            <Link passHref href="/your-feature">
              <a>
                <F defaultMessage="Your Feature" />
              </a>
            </Link>
          </li>
        </List>
      </nav>

      <LoginWrapper>
        <LoginLogoutButton />
      </LoginWrapper>
    </header>
  );
}
