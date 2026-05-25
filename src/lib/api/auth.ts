import { apiClient, unwrapData } from "@/lib/api-client";
import type { ApiSuccessResponse } from "@/lib/api-response";
import type { AuthTokens, AuthUser, LoginCredentials } from "@/types";
import type {
  ForgotPasswordInput,
  ResetPasswordInput,
} from "@/lib/validations/auth";

export async function login(credentials: LoginCredentials) {
  const response = await apiClient.post<
    ApiSuccessResponse<{ user: AuthUser; tokens: AuthTokens }>
  >("/auth/login", credentials);
  return unwrapData(response);
}

export async function logout() {
  await apiClient.post("/auth/logout");
}

export async function getMe() {
  const response = await apiClient.get<ApiSuccessResponse<AuthUser>>("/auth/me");
  return unwrapData(response);
}

export async function forgotPassword(input: ForgotPasswordInput) {
  const response = await apiClient.post<ApiSuccessResponse<{ message: string }>>(
    "/auth/forgot-password",
    input,
  );
  return unwrapData(response);
}

export async function resetPassword(input: ResetPasswordInput) {
  const response = await apiClient.post<ApiSuccessResponse<{ message: string }>>(
    "/auth/reset-password",
    input,
  );
  return unwrapData(response);
}

export async function changePassword(data: {
  currentPassword: string;
  newPassword: string;
}) {
  const response = await apiClient.post<ApiSuccessResponse<{ message: string }>>(
    "/auth/change-password",
    data,
  );
  return unwrapData(response);
}

export async function updateProfile(data: {
  firstName?: string;
  lastName?: string;
  phone?: string;
  department?: string;
}) {
  const response = await apiClient.patch<ApiSuccessResponse<AuthUser>>(
    "/auth/profile",
    data,
  );
  return unwrapData(response);
}
