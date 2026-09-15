export type EmployeeProject = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  progress: number;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
  role: string;
  joinedAt: string;
  teamMembers: {
    id: string;
    userId: string;
    role: string;
    joinedAt: string;
    user: {
      id: string;
      employeeId: string;
      fullName: string | null;
      profileImage: string | null;
    };
  }[];
};
