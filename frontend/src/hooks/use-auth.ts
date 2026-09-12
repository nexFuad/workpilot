'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authServer } from '@/server/auth.server';
import type { LoginInput } from '@/types/auth.types';

const authKey = ['auth', 'me'] as const;
export function useAuth() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: authKey,
    queryFn: authServer.me,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
  const login = useMutation({
    mutationFn: (input: LoginInput) => authServer.login(input),
    onSuccess: (data) => queryClient.setQueryData(authKey, data),
  });
  const logout = useMutation({
    mutationFn: authServer.logout,
    onSuccess: () => queryClient.removeQueries({ queryKey: authKey }),
  });
  return {
    user: query.data?.user,
    isLoading: query.isLoading,
    isAuthenticated: Boolean(query.data?.user),
    login,
    logout,
  };
}
