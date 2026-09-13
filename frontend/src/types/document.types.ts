export type EmployeeDocument = {
  id: string;
  name: string;
  fileUrl: string;
  fileType: string;
  size: number;
  status: 'pending' | 'approved' | 'rejected';
  reviewerNote: string | null;
  createdAt: string;
};
