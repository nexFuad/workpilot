'use client';

import { useQuery, type QueryKey } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

type UseSearchBarOptions<TData> = {
  queryKey: QueryKey;
  queryFn: (search: string) => Promise<TData>;
  debounceMs?: number;
};

/**
 * Reusable server-side search hook. Pass the API function for a feature; this
 * hook only debounces the text and requests results—it never filters local data.
 */
export function useSearchBar<TData>({
  queryKey,
  queryFn,
  debounceMs = 350,
}: UseSearchBarOptions<TData>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm.trim()), debounceMs);
    return () => clearTimeout(timer);
  }, [debounceMs, searchTerm]);

  const query = useQuery({
    queryKey: [...queryKey, debouncedSearch],
    queryFn: () => queryFn(debouncedSearch),
  });

  return { searchTerm, setSearchTerm, debouncedSearch, ...query };
}
