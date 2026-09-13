export type LeaveRequestInput = {
  leaveType: string;
  reason: string;
  startDate: string;
  endDate: string;
};

export type LeaveRequest = LeaveRequestInput & {
  id: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
};
