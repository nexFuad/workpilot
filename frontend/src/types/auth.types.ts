export type UserRole = 'admin' | 'hr' | 'employee';

export type AuthUser = {
  id: string;
  employeeId: string;
  companyName: string;
  role: UserRole;
  fullName: string | null;
  phone: string | null;
  address: string | null;
  profileImage: string | null;
};
export type LoginInput = {
  employeeId: string;
  companyName: string;
  password: string;
  rememberMe: boolean;
};
export type AuthResponse = { user: AuthUser };
export type SessionResponse = { user: AuthUser | null };
