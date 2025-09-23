import { vi } from 'vitest';
import '@testing-library/jest-dom/vitest';

// Polyfill Next.js router for component tests
declare global {
  // eslint-disable-next-line no-var
  var __NEXT_TEST_ROUTER__: {
    replace: (href: string) => void;
    refresh: () => void;
  } | undefined;
}

vi.mock('next/navigation', () => {
  return {
    useRouter: () =>
      globalThis.__NEXT_TEST_ROUTER__ ?? {
        replace: vi.fn(),
        refresh: vi.fn(),
      },
  };
});

vi.mock('sonner', async () => {
  const actual = (await vi.importActual<typeof import('sonner')>('sonner')) || {};
  return {
    ...actual,
    toast: {
      success: vi.fn(),
      error: vi.fn(),
    },
  };
});
