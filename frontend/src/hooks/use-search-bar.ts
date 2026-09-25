'use client';

import { useInfiniteQuery, useQuery, type QueryKey } from '@tanstack/react-query';
import { useState } from 'react';
import { useDebouncedValue } from '@/hooks/use-debounced-value';

type UseSearchBarOptions<TData> = {
  queryKey: QueryKey;
  queryFn: (search: string) => Promise<TData>;
  debounceMs?: number;
};

function useSearchTerm(debounceMs: number) {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebouncedValue(searchTerm.trim(), debounceMs);
  return { searchTerm, setSearchTerm, debouncedSearch };
}

/** Debounces search text and fetches a page from the feature's API. */
export function useSearchBar<TData>({
  queryKey,
  queryFn,
  debounceMs = 350,
}: UseSearchBarOptions<TData>) {
  const search = useSearchTerm(debounceMs);

  const query = useQuery({
    queryKey: [...queryKey, search.debouncedSearch],
    queryFn: () => queryFn(search.debouncedSearch),
  });

  return { ...search, ...query };
}

type UseInfiniteSearchBarOptions<TPage> = {
  queryKey: QueryKey;
  queryFn: (search: string, pageParam: number) => Promise<TPage>;
  getNextPageParam: (lastPage: TPage) => number | undefined;
  initialPageParam?: number;
  debounceMs?: number;
};

/** Shares search behavior with useSearchBar while retaining infinite pagination. */
export function useInfiniteSearchBar<TPage>({
  queryKey,
  queryFn,
  getNextPageParam,
  initialPageParam = 0,
  debounceMs = 350,
}: UseInfiniteSearchBarOptions<TPage>) {
  const search = useSearchTerm(debounceMs);
  const query = useInfiniteQuery({
    queryKey: [...queryKey, search.debouncedSearch],
    queryFn: ({ pageParam }) => queryFn(search.debouncedSearch, pageParam),
    initialPageParam,
    getNextPageParam,
  });

  return { ...search, ...query };
}
