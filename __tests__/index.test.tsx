import { render, screen } from 'util/testing';

import Page404 from 'app/[lang]/not-found';

describe('404', () => {
  it('renders a heading', async () => {
    render(<Page404 />);

    const heading = screen.getByRole('heading', {
      name: /not found/i,
    });

    expect(heading).toBeInTheDocument();
  });
});
