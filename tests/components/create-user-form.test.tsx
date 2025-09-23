import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CreateUserForm } from '@/components/auth/create-user-form';
import { toast } from 'sonner';

describe('CreateUserForm', () => {
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

  it('submits with selected role', async () => {
    (global.fetch as vi.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: { id: '1' } }),
    });

    render(
      <CreateUserForm
        allowedRoles={['user', 'admin']}
        heading="Create"
      />
    );

    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: 'Jane Admin' },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'jane@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/temporary password/i), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByLabelText(/role/i), {
      target: { value: 'admin' },
    });

    fireEvent.submit(screen.getByRole('button', { name: /create user/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/users',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    const payload = JSON.parse((global.fetch as vi.Mock).mock.calls[0][1].body as string);
    expect(payload.role).toBe('admin');
    expect(toast.success).toHaveBeenCalled();
  });

  it('shows error toast when server responds with error', async () => {
    (global.fetch as vi.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Email already in use' }),
    });

    render(
      <CreateUserForm
        allowedRoles={['user']}
        heading="Create"
      />
    );

    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: 'Jane User' },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'jane2@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/temporary password/i), {
      target: { value: 'password123' },
    });

    fireEvent.submit(screen.getByRole('button', { name: /create user/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Email already in use');
    });
  });
});
