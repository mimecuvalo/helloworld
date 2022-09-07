import { render, screen } from 'util/testing';

import Home from 'pages/index';

describe('Home', () => {
  it('renders a heading', async () => {
    render(<Home />);

    const heading = screen.getByRole('heading', {
      name: /Hello, world\./i,
    });

    expect(heading).toBeInTheDocument();
  });
});
