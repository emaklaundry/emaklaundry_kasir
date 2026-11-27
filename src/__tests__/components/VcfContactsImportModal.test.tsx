import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import VcfContactsImportModal from '@/components/VcfContactsImportModal';

const vcf = [
  'BEGIN:VCARD',
  'VERSION:3.0',
  'FN:Ayu Sari',
  'TEL:08123456789',
  'END:VCARD',
  'BEGIN:VCARD',
  'VERSION:3.0',
  'FN:Sudah Ada',
  'TEL:+62 811 1111',
  'END:VCARD',
].join('\n');

describe('VcfContactsImportModal', () => {
  it('reads a .vcf file, hides existing customers, and imports selected contacts', async () => {
    const onImport = vi.fn(async () => {});
    render(
      <VcfContactsImportModal
        isOpen
        onClose={vi.fn()}
        onImport={onImport}
        existingPhones={['08111111']}
      />,
    );

    const file = new File([vcf], 'kontak.vcf', { type: 'text/vcard' });
    fireEvent.change(screen.getByTestId('vcf-file-input'), { target: { files: [file] } });

    const checkbox = await screen.findByRole('checkbox', { name: /Ayu Sari/ });
    expect(screen.queryByText('Sudah Ada')).not.toBeInTheDocument();

    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();

    fireEvent.click(screen.getByRole('button', { name: /Import \(1\)/ }));
    await waitFor(() =>
      expect(onImport).toHaveBeenCalledWith([
        expect.objectContaining({ name: 'Ayu Sari', phone: '08123456789' }),
      ]),
    );
  });
});
