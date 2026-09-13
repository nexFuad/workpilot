'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { documentsServer } from '@/server/documents.server';
import type { EmployeeDocument } from '@/types/document.types';
export function useDocuments() {
  const client = useQueryClient();
  const refresh = () => client.invalidateQueries({ queryKey: ['documents'] });
  return {
    documents: useQuery({ queryKey: ['documents'], queryFn: documentsServer.list }),
    create: useMutation({
      mutationFn: (data: Omit<EmployeeDocument, 'id' | 'status' | 'reviewerNote' | 'createdAt'>) =>
        documentsServer.create(data),
      onSuccess: refresh,
    }),
  };
}
