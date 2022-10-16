import Page404 from 'pages/404';
import { render } from 'util/testing';

it('renders homepage unchanged', () => {
  const { container } = render(<Page404 />);
  expect(container).toMatchSnapshot();
});
