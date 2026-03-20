'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import GameballWidget from '@/app/(shop)/profile/GameballWidget';

function AuthLoader({ children }: { children: React.ReactNode }) {
  const { user, fetchProfile } = useAuth();

  useEffect(() => {
    fetchProfile();
  }, []);

  return (
    <>
      {children}
      {user && <GameballWidget userId={user.id} />}
    </>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000, // 30 seconds
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthLoader>{children}</AuthLoader>
    </QueryClientProvider>
  );
}
