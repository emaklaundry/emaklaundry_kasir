import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import EmployeesPage from '@/pages/management/EmployeesPage';
import { Employee } from '@/types/hrm';

const employees: Employee[] = [
  {
    id: 'e1',
    storeId: 's1',
    name: 'Siti Aminah',
    phone: '081234567890',
    role: 'kasir',
    workDays: [1, 2, 3, 4, 5, 6],
    shiftStart: '08:00',
    shiftEnd: '17:00',
    lateToleranceMinutes: 15,
    baseSalary: 2000000,
    commissionRate: 2,
    monthlyIncentive: 0,
    isActive: true,
    loginEnabled: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'e2',
    storeId: 's1',
    name: 'Budi Lama',
    role: 'operator',
    workDays: [1, 2, 3],
    lateToleranceMinutes: 15,
    baseSalary: 1500000,
    commissionRate: 0,
    monthlyIncentive: 0,
    isActive: false,
    loginEnabled: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const updateEmployee = vi.fn().mockResolvedValue(undefined);
const fetchEmployees = vi.fn().mockResolvedValue(undefined);
vi.mock('@/contexts/useEmployees', () => ({
  useEmployees: () => ({
    employees,
    isLoading: false,
    fetchEmployees,
    addEmployee: vi.fn(),
    updateEmployee,
    deleteEmployee: vi.fn(),
  }),
}));
vi.mock('@/contexts/UserContext', () => ({ useUsers: () => ({ users: [] }) }));
vi.mock('@/contexts/useAppContext', () => ({
  default: () => ({
    currentUser: { id: 'a1', role: 'Admin', storeId: 's1' },
    stores: [{ id: 's1', name: 'Cabang Banjar', address: '', isActive: true }],
    selectedStoreId: 's1',
  }),
}));
const addToast = vi.fn();
vi.mock('@/contexts/useToasts', () => ({ default: () => ({ addToast }) }));
const syncEmployeeLogin = vi.fn().mockResolvedValue(undefined);
vi.mock('@/utils/employeeLogin', () => ({
  setEmployeePin: vi.fn(),
  syncEmployeeLogin: (...args: unknown[]) => syncEmployeeLogin(...args),
  revokeEmployeeLogin: vi.fn(),
}));

describe('EmployeesPage', () => {
  beforeEach(() => {
    updateEmployee.mockClear();
    syncEmployeeLogin.mockClear();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });

  const table = () => screen.getByRole('table');

  it('default hanya menampilkan karyawan aktif, bisa beralih ke Nonaktif/Semua', () => {
    render(<EmployeesPage />);
    expect(within(table()).getByText('Siti Aminah')).toBeInTheDocument();
    expect(within(table()).queryByText('Budi Lama')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('radio', { name: 'Nonaktif' }));
    expect(within(table()).getByText('Budi Lama')).toBeInTheDocument();
    expect(within(table()).queryByText('Siti Aminah')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('radio', { name: 'Semua' }));
    expect(within(table()).getAllByRole('row')).toHaveLength(3);
  });

  it('pencarian nama menyaring daftar', () => {
    render(<EmployeesPage />);
    fireEvent.click(screen.getByRole('radio', { name: 'Semua' }));
    fireEvent.change(screen.getByLabelText('Cari karyawan'), { target: { value: 'budi' } });
    expect(within(table()).getByText('Budi Lama')).toBeInTheDocument();
    expect(within(table()).queryByText('Siti Aminah')).not.toBeInTheDocument();
  });

  it('menampilkan jadwal, kompensasi, dan status login', () => {
    render(<EmployeesPage />);
    const row = within(table()).getByText('Siti Aminah').closest('tr')!;
    expect(within(row).getByText('Sen–Sab, 08:00–17:00')).toBeInTheDocument();
    expect(within(row).getByText(/Rp 2\.000\.000 \+2% komisi/)).toBeInTheDocument();
    expect(within(row).getByText('Bisa login')).toBeInTheDocument();
  });

  it('Nonaktifkan menyimpan status lalu menutup login karyawan', async () => {
    render(<EmployeesPage />);
    const row = within(table()).getByText('Siti Aminah').closest('tr')!;
    fireEvent.click(within(row).getByRole('button', { name: 'Nonaktifkan' }));
    await waitFor(() => expect(syncEmployeeLogin).toHaveBeenCalledWith('e1'));
    expect(updateEmployee).toHaveBeenCalledWith('e1', { isActive: false });
  });

  it('Admin tidak melihat pilihan cabang (terkunci ke cabangnya)', () => {
    render(<EmployeesPage />);
    expect(screen.queryByLabelText('Filter cabang')).not.toBeInTheDocument();
    expect(fetchEmployees).toHaveBeenCalledWith('s1');
  });
});
