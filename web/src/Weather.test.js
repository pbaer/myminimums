import { render, screen } from '@testing-library/react';
import Weather from './Weather';

test('renders S43 info', () => {
  render(<Weather />);
  setTimeout(() => {
    const linkElement = screen.getByText(/S43/i);
    expect(linkElement).toBeInTheDocument();
  }, 5000);
});
