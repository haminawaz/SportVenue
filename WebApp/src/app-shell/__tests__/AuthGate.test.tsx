import { render, screen } from '@testing-library/react';

import { AuthGate } from '../AuthGate';

const state = vi.hoisted(() => ({ status: 'loading' as 'loading' | 'signedIn' | 'signedOut', replace: vi.fn() }));
vi.mock('@/session/SessionProvider', () => ({ useAuth: () => ({ status: state.status }) }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: state.replace }) }));

beforeEach(() => state.replace.mockClear());

describe('AuthGate', () => {
  it('renders public pages while the session loads, so the prerendered HTML has the real page', () => {
    state.status = 'loading';
    render(<AuthGate require="signedOut">landing</AuthGate>);
    expect(screen.getByText('landing')).toBeInTheDocument();
    expect(state.replace).not.toHaveBeenCalled();
  });

  it('keeps signed-in pages behind a spinner while the session loads', () => {
    state.status = 'loading';
    render(<AuthGate require="signedIn">dashboard</AuthGate>);
    expect(screen.queryByText('dashboard')).not.toBeInTheDocument();
  });

  it('sends a signed-in owner from a public page to the dashboard', () => {
    state.status = 'signedIn';
    render(<AuthGate require="signedOut">landing</AuthGate>);
    expect(screen.queryByText('landing')).not.toBeInTheDocument();
    expect(state.replace).toHaveBeenCalledWith('/');
  });

  it('sends a signed-out visitor from the app to the landing page', () => {
    state.status = 'signedOut';
    render(<AuthGate require="signedIn">dashboard</AuthGate>);
    expect(screen.queryByText('dashboard')).not.toBeInTheDocument();
    expect(state.replace).toHaveBeenCalledWith('/welcome');
  });
});
