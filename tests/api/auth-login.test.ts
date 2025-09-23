import { describe, expect, it, beforeEach, vi } from 'vitest';

import { POST } from '@/app/api/auth/login/route';

const connectDB = vi.hoisted(() => vi.fn());
vi.mock('@/lib/db', () => ({ connectDB }));

const findOne = vi.hoisted(() => vi.fn());
vi.mock('@/models/user', () => ({
  UserModel: {
    findOne,
  },
}));

const verifyPassword = vi.hoisted(() => vi.fn());
const createToken = vi.hoisted(() => vi.fn(async () => 'token'));
const setAuthCookie = vi.hoisted(() => vi.fn());

vi.mock('@/lib/auth', () => ({
  verifyPassword,
  createToken,
  setAuthCookie,
}));

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects invalid credentials when user not found', async () => {
    findOne.mockReturnValueOnce({
      select: vi.fn().mockResolvedValueOnce(null),
    });

    const request = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'missing@example.com', password: 'password123' }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe('Invalid credentials');
  });

  it('returns token when credentials valid', async () => {
    const mockUser = {
      _id: { toString: () => 'abc123' },
      email: 'valid@example.com',
      name: 'Valid User',
      password: 'hashed',
      role: 'user',
    };

    findOne.mockReturnValueOnce({
      select: vi.fn().mockResolvedValueOnce(mockUser),
    });
    verifyPassword.mockResolvedValueOnce(true);

    const request = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'valid@example.com', password: 'password123' }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.user).toMatchObject({ email: 'valid@example.com' });
    expect(createToken).toHaveBeenCalled();
    expect(setAuthCookie).toHaveBeenCalled();
  });

  it('rejects wrong password', async () => {
    findOne.mockReturnValueOnce({
      select: vi.fn().mockResolvedValueOnce({ password: 'hashed' }),
    });
    verifyPassword.mockResolvedValueOnce(false);

    const request = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'user@example.com', password: 'wrongpass' }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe('Invalid credentials');
  });
});
