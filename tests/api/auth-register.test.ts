import { describe, expect, it, beforeEach, vi } from 'vitest';

import { POST } from '@/app/api/auth/register/route';

const connectDB = vi.hoisted(() => vi.fn());
vi.mock('@/lib/db', () => ({ connectDB }));

const findOne = vi.hoisted(() => vi.fn());
const countDocuments = vi.hoisted(() => vi.fn());
const create = vi.hoisted(() => vi.fn());

const roles = vi.hoisted(() => ['user', 'admin', 'superadmin'] as const);

vi.mock('@/models/user', () => ({
  UserModel: {
    findOne,
    countDocuments,
    create,
  },
  roles,
}));

const hashPassword = vi.hoisted(() => vi.fn(async () => 'hashed-password'));
const createToken = vi.hoisted(() => vi.fn(async () => 'token'));
const setAuthCookie = vi.hoisted(() => vi.fn());

vi.mock('@/lib/auth', () => ({
  hashPassword,
  createToken,
  setAuthCookie,
}));

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates the first user as superadmin', async () => {
    findOne.mockResolvedValueOnce(null);
    countDocuments.mockResolvedValueOnce(0);
    create.mockResolvedValueOnce({
      _id: { toString: () => '1' },
      name: 'First User',
      email: 'first@example.com',
      role: 'superadmin',
    });

    const request = new Request('http://localhost/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'First User',
        email: 'first@example.com',
        password: 'password123',
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.user).toMatchObject({ role: 'superadmin' });
    expect(hashPassword).toHaveBeenCalledWith('password123');
    expect(createToken).toHaveBeenCalled();
    expect(setAuthCookie).toHaveBeenCalled();
  });

  it('rejects duplicate emails', async () => {
    findOne.mockResolvedValueOnce({ _id: 'existing' });

    const request = new Request('http://localhost/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Jane',
        email: 'duplicate@example.com',
        password: 'password123',
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.error).toBe('Email already in use');
  });

  it('prevents non-admin role assignment on subsequent users', async () => {
    findOne.mockResolvedValueOnce(null);
    countDocuments.mockResolvedValueOnce(5);

    const request = new Request('http://localhost/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Bob',
        email: 'bob@example.com',
        password: 'password123',
        role: 'admin',
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toBe('Only existing admins can assign elevated roles');
  });
});
