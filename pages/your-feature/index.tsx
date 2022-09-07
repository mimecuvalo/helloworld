import { Container } from '@mui/material';
import { F } from 'i18n';

/**
 * Provides a simple React component as an example React component to manipulate out-of-the-box.
 */
export default function YourFeature() {
  return (
    <Container>
      <h2>
        <F defaultMessage="Your Feature" />
      </h2>
      <ul>
        <li>
          <F defaultMessage="Rendering with React" />
        </li>
      </ul>
    </Container>
  );
}
