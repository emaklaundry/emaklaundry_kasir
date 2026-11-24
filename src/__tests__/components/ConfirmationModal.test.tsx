import { render, screen, fireEvent } from '@testing-library/react';
import ConfirmationModal from '@/components/ConfirmationModal';
import { vi } from 'vitest';

describe('ConfirmationModal', () => {
  it('renders with title and message', () => {
    render(
      <ConfirmationModal
        isOpen={true}
        onClose={() => {}}
        onConfirm={() => {}}
        title="Test Title"
        message="Test Message"
      />,
    );
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Message')).toBeInTheDocument();
    expect(screen.getByText('Batal')).toBeInTheDocument();
    expect(screen.getByText('Hapus')).toBeInTheDocument();
  });

  it('calls onClose when Batal is clicked', () => {
    const onClose = vi.fn();
    render(
      <ConfirmationModal
        isOpen={true}
        onClose={onClose}
        onConfirm={() => {}}
        title="Test Title"
        message="Test Message"
      />,
    );
    fireEvent.click(screen.getByText('Batal'));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onConfirm when Hapus is clicked', () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmationModal
        isOpen={true}
        onClose={() => {}}
        onConfirm={onConfirm}
        title="Test Title"
        message="Test Message"
      />,
    );
    fireEvent.click(screen.getByText('Hapus'));
    expect(onConfirm).toHaveBeenCalled();
  });

  it('shows spinner when isConfirming is true', () => {
    render(
      <ConfirmationModal
        isOpen={true}
        onClose={() => {}}
        onConfirm={() => {}}
        title="Test Title"
        message="Test Message"
        isConfirming={true}
      />,
    );
    // Find the disabled confirm button (has no accessible name when spinner is shown)
    const buttons = screen.getAllByRole('button');
    // The confirm button is the last button in the footer
    const confirmBtn = buttons[buttons.length - 1];
    expect(confirmBtn).toBeDisabled();
    // SpinnerIcon should be present
    expect(screen.getByTestId('spinner-icon')).toBeInTheDocument();
  });
});
