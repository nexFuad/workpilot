export type Site = { id: string; name: string; location: string };
export type Shift = { id: string; name: string; startTime: string; endTime: string };
export type Attendance = {
  id: string;
  checkInAt: string;
  checkInPhotoUrl: string;
  checkOutAt: string | null;
  checkOutPhotoUrl: string | null;
  checkInSite: Site;
  checkInShift: Shift;
  checkOutSite: Site | null;
  checkOutShift: Shift | null;
};
export type AttendanceAction = {
  siteId: string;
  shiftId: string;
  photoUrl: string;
  occurredAt: string;
};
