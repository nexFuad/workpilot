'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { hrDocumentsServer } from '@/server/hr-documents.server';
export function useHrDocuments() {
  const c = useQueryClient();
  const refresh = () => c.invalidateQueries({ queryKey: ['hr', 'documents'] });
  return {
    documents: useQuery({ queryKey: ['hr', 'documents'], queryFn: hrDocumentsServer.list }),
    review: useMutation({
      mutationFn: ({
        id,
        status,
        note,
      }: {
        id: string;
        status: 'approved' | 'rejected';
        note: string;
      }) => hrDocumentsServer.review(id, status, note),
      onSuccess: refresh,
    }),
  };
}
