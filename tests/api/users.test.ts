import { beforeEach, describe, expect, it, vi } from 'vitest';

import { POST } from '@/app/api/users/route';

const connectDB = vi.hoisted(() => vi.fn());
vi.mock('@/lib/db', () => ({ connectDB }));

const findOne = vi.hoisted(() => vi.fn());
const create = vi.hoisted(() => vi.fn());

vi.mock('@/models/user', () => ({
  UserModel: {
    findOne,
    create,
  },
  roles: ['user', 'admin', 'superadmin'],
}));

const hashPassword = vi.hoisted(() => vi.fn(async () => 'hashed'));
const getCurrentUser = vi.hoisted(() => vi.fn());

vi.mock('@/lib/auth', () => ({
  hashPassword,
  getCurrentUser,
}));

describe('POST /api/users', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('requires authentication', async () => {
    getCurrentUser.mockResolvedValueOnce(null);

    const request = new Request('http://localhost/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test', email: 'test@example.com', password: 'password123' }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('allows superadmin to create admin', async () => {
    getCurrentUser.mockResolvedValueOnce({ role: 'superadmin' });
    findOne.mockResolvedValueOnce(null);
    create.mockResolvedValueOnce({
      _id: { toString: () => 'new-id' },
      name: 'Admin User',
      email: 'admin@example.com',
      role: 'admin',
    });

    const request = new Request('http://localhost/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'password123',
        role: 'admin',
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.user).toMatchObject({ role: 'admin' });
    expect(hashPassword).toHaveBeenCalled();
  });

  it('prevents admin from assigning elevated roles', async () => {
    getCurrentUser.mockResolvedValueOnce({ role: 'admin' });

    const request = new Request('http://localhost/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Some Admin',
        email: 'admin2@example.com',
        password: 'password123',
        role: 'admin',
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toBe('You cannot assign that role');
  });
});
