import { fireEvent, render, screen } from '@testing-library/react';
import GoogleContactsImportModal from '@/components/GoogleContactsImportModal';

const mocks = vi.hoisted(() => ({
  contacts: [
    {
      resourceName: 'people/1',
      name: 'Ayu Sari',
      phone: '08123456789',
      address: '',
    },
  ],
}));

vi.mock('@/hooks/useGoogleContacts', () => ({
  default: () => ({
    contacts: mocks.contacts,
    isLoading: false,
    error: null,
    isAuthenticated: true,
    signIn: vi.fn(),
    signOut: vi.fn(),
    fetchContacts: vi.fn(),
  }),
}));

describe('GoogleContactsImportModal', () => {
  it('lets users select contacts with a native checkbox', () => {
    render(
      <GoogleContactsImportModal
        isOpen
        onClose={vi.fn()}
        onImport={async () => {}}
        existingPhones={[]}
      />,
    );

    const contactCheckbox = screen.getByRole('checkbox', { name: /Ayu Sari/ });
    expect(contactCheckbox).not.toBeChecked();

    fireEvent.click(contactCheckbox);

    expect(contactCheckbox).toBeChecked();
  });
});
