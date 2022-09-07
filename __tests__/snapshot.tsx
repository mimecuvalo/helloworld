import Home from 'pages/index';
import { render } from 'util/testing';

it('renders homepage unchanged', () => {
  const { container } = render(<Home />);
  expect(container).toMatchSnapshot();
});
