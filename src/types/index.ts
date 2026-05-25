import type { Permission } from "@/lib/constants";
import { ROLES } from "@/lib/constants";

export type Role = `${ROLES}`;

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  department?: string | null;
  phone?: string | null;
  isActive: boolean;
  lastLoginAt?: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface AuthUser
  extends Pick<User, "id" | "email" | "firstName" | "lastName" | "role"> {
  permissions: Permission[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface Session {
  user: AuthUser;
  accessToken: string;
  refreshToken?: string;
}

export interface JwtAccessPayload {
  sub: string;
  email: string;
  role: Role;
  type: "access";
}

export interface JwtRefreshPayload {
  sub: string;
  type: "refresh";
}

export interface PaginatedResult<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  pendingLeaves: number;
  todayAttendance: number;
  openNotifications: number;
  recentActivities: ActivityItem[];
}

export interface ActivityItem {
  id: string;
  action: string;
  module: string;
  userId?: string | null;
  createdAt: Date | string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  link?: string | null;
  isRead: boolean;
  createdAt: Date | string;
}

export interface AuditLogEntry {
  id: string;
  userId?: string | null;
  action: string;
  tableName: string;
  recordId: string;
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  ipAddress?: string | null;
  createdAt: Date | string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface CreateUserInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: Role;
  department?: string;
}

export type AppStatus =
  | "ACTIVE"
  | "INACTIVE"
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED"
  | "COMPLETED"
  | "IN_PROGRESS"
  | "DRAFT"
  | "OVERDUE"
  | "SCHEDULED"
  | "CHECKED_IN"
  | "CHECKED_OUT";
