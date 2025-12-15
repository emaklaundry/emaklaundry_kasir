import { render } from '@testing-library/react';

describe('EmptyState', () => {
  it('renders without crashing', () => {
    render(<div />);
  });
});
