'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './auth-context';

/** Redirects to the login page once we know the visitor is not authenticated. */
export function useRequireAuth(): { ready: boolean } {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  return { ready: !loading && Boolean(user) };
}
