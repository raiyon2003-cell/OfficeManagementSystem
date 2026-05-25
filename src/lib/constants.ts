export const APP_NAME = "Office Management";

export enum ROLES {
  SUPER_ADMIN = "SUPER_ADMIN",
  ADMIN = "ADMIN",
  MANAGER = "MANAGER",
  EMPLOYEE = "EMPLOYEE",
  HR = "HR",
  FINANCE = "FINANCE",
}

export const PERMISSIONS = {
  USERS_READ: "users:read",
  USERS_WRITE: "users:write",
  USERS_DELETE: "users:delete",
  EMPLOYEES_READ: "employees:read",
  EMPLOYEES_WRITE: "employees:write",
  ATTENDANCE_READ: "attendance:read",
  ATTENDANCE_WRITE: "attendance:write",
  LEAVES_READ: "leaves:read",
  LEAVES_WRITE: "leaves:write",
  LEAVES_APPROVE: "leaves:approve",
  PAYROLL_READ: "payroll:read",
  PAYROLL_WRITE: "payroll:write",
  DOCUMENTS_READ: "documents:read",
  DOCUMENTS_WRITE: "documents:write",
  REPORTS_READ: "reports:read",
  SETTINGS_READ: "settings:read",
  SETTINGS_WRITE: "settings:write",
  AUDIT_READ: "audit:read",
  NOTIFICATIONS_READ: "notifications:read",
  NOTIFICATIONS_WRITE: "notifications:write",
  VISITORS_READ: "visitors:read",
  VISITORS_WRITE: "visitors:write",
  VISITORS_APPROVE: "visitors:approve",
  MEETING_ROOMS_READ: "meeting_rooms:read",
  MEETING_ROOMS_WRITE: "meeting_rooms:write",
  BOOKINGS_READ: "bookings:read",
  BOOKINGS_WRITE: "bookings:write",
  BOOKINGS_APPROVE: "bookings:approve",
  INVENTORY_READ: "inventory:read",
  INVENTORY_WRITE: "inventory:write",
  STATIONERY_READ: "stationery:read",
  STATIONERY_WRITE: "stationery:write",
  VENDORS_READ: "vendors:read",
  VENDORS_WRITE: "vendors:write",
  PURCHASE_READ: "purchase:read",
  PURCHASE_WRITE: "purchase:write",
  PURCHASE_APPROVE: "purchase:approve",
  EXPENSES_READ: "expenses:read",
  EXPENSES_WRITE: "expenses:write",
  DASHBOARD_READ: "dashboard:read",
  ACTIVITY_READ: "activity:read",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const PAGINATION_DEFAULTS = {
  page: 1,
  limit: 20,
  maxLimit: 100,
} as const;

export const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
export const SESSION_TIMEOUT_SECONDS = 30 * 60;

export const JWT_ACCESS_EXPIRY = "15m";
export const JWT_REFRESH_EXPIRY = "7d";

export const AUTH_COOKIE_NAMES = {
  ACCESS_TOKEN: "access_token",
  REFRESH_TOKEN: "refresh_token",
} as const;

export const RATE_LIMIT_DEFAULTS = {
  windowMs: 60 * 1000,
  maxRequests: 100,
} as const;
