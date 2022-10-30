import A11y from './A11y';
import Performance from './Performance';
import { styled } from 'components';

const Container = styled('div')`
  white-space: nowrap;
  display: inline-block;
`;

export default function DebugTray() {
  return (
    <Container>
      <A11y />
      <Performance />
    </Container>
  );
}
