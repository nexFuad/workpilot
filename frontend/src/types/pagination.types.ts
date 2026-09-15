export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type ListParams = {
  search?: string;
  status?: string;
  role?: string;
  month?: string;
  date?: string;
  page?: number;
  limit?: number;
};
