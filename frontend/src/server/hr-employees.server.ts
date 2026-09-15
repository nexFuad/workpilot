import { apiRequest } from '@/server/auth.server';
import type {
  HrEmployee,
  HrEmployeeDetailsResponse,
  HrEmployeeInput,
  HrEmployeesResponse,
} from '@/types/hr-employee.types';
import { listQuery } from '@/lib/list-query';
import type { ListParams } from '@/types/pagination.types';

export const hrEmployeesServer = {
  list: (params: ListParams = {}) =>
    apiRequest<HrEmployeesResponse>(`/api/hr/employees${listQuery(params)}`),
  get: (id: string) => apiRequest<HrEmployeeDetailsResponse>(`/api/hr/employees/${id}`),
  create: (input: HrEmployeeInput) =>
    apiRequest<{ employee: HrEmployee }>('/api/hr/employees', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  update: (id: string, input: HrEmployeeInput) =>
    apiRequest<{ employee: HrEmployee }>(`/api/hr/employees/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),
  setStatus: (id: string, isActive: boolean) =>
    apiRequest<{ employee: HrEmployee }>(`/api/hr/employees/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    }),
  remove: (id: string) =>
    apiRequest<{ message: string }>(`/api/hr/employees/${id}`, { method: 'DELETE' }),
};
