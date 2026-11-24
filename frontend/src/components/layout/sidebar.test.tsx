import { render, screen } from '@testing-library/react';
import { getUser, hasPermission } from '@/lib/auth';
import { Sidebar } from './sidebar';

jest.mock('@/lib/auth', () => ({
  getUser: jest.fn(),
  hasPermission: jest.fn(),
  logout: jest.fn(),
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, ...props }: any) =>
    require('react').createElement('a', { href, ...props }, children),
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ priority, ...props }: any) => require('react').createElement('img', props),
}));

jest.mock('next/navigation', () => ({
  usePathname: () => '/admin/portero',
  useRouter: () => ({ replace: jest.fn() }),
}));

const mockGetUser = getUser as jest.Mock;
const mockHasPermission = hasPermission as jest.Mock;

describe('Sidebar role navigation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows both Portería workspaces without exposing the admin menu', () => {
    mockGetUser.mockReturnValue({ email: 'portero@clinica.com', rol: 'PORTERO' });
    mockHasPermission.mockReturnValue(false);

    render(<Sidebar />);

    expect(screen.getByRole('link', { name: 'Búsqueda de pacientes' })).toHaveAttribute('href', '/portero');
    expect(screen.getByRole('link', { name: 'Control de citas del día' })).toHaveAttribute('href', '/admin/portero');
    expect(screen.queryByRole('link', { name: 'Pacientes' })).not.toBeInTheDocument();
    expect(screen.getByText('Portería')).toBeInTheDocument();
  });

  it('filters Admisión navigation by explicit permissions', () => {
    mockGetUser.mockReturnValue({ email: 'admision@clinica.com', rol: 'ADMISION' });
    mockHasPermission.mockImplementation((permission: string) => permission === 'verTodasCitas');

    render(<Sidebar />);

    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('href', '/admin');
    expect(screen.getByRole('link', { name: 'Citas' })).toHaveAttribute('href', '/admin/citas');
    expect(screen.queryByRole('link', { name: 'Seguros' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Admisión' })).toBeInTheDocument();
  });
});
