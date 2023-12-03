import { render, screen } from '@testing-library/react';
import App from './App';

test('renders learn react link', () => {
  render(<App />);
  setTimeout(() => {
    const linkElement = screen.getByText(/S43/i);
    expect(linkElement).toBeInTheDocument();
  }, 5000);
});
