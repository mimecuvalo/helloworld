import Page404 from 'app/[lang]/not-found';
import { render } from 'util/testing';

it('renders homepage unchanged', () => {
  const { container } = render(<Page404 />);
  expect(container).toMatchSnapshot();
});
