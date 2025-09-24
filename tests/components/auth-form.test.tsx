import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthForm } from '@/components/auth/auth-form';
import { toast } from 'sonner';

describe('AuthForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn());
    globalThis.__NEXT_TEST_ROUTER__ = {
      replace: vi.fn(),
      refresh: vi.fn(),
    };
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('validates required fields for register mode', async () => {
    render(<AuthForm mode="register" />);

    fireEvent.submit(screen.getByRole('button', { name: /get started/i }));

    expect(await screen.findByText(/name must be at least 2 characters/i)).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('submits login form and shows success toast', async () => {
    (global.fetch as vi.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: { id: '1', role: 'user' } }),
    });

    render(<AuthForm mode="login" />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });

    fireEvent.submit(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/auth/login',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    expect(toast.success).toHaveBeenCalled();
    expect(globalThis.__NEXT_TEST_ROUTER__?.replace).toHaveBeenCalledWith('/');
  });

  it('redirects admin users to the admin area', async () => {
    (global.fetch as vi.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: { id: '1', role: 'admin' } }),
    });

    render(<AuthForm mode="login" />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'admin@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });

    fireEvent.submit(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/auth/login',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    expect(globalThis.__NEXT_TEST_ROUTER__?.replace).toHaveBeenCalledWith('/admin');
  });
});
