import "server-only";

import { auth } from "@/src/lib/auth/server";

type ApiError = { message: string; status?: number; code?: string } | null;
type ApiResult<T = unknown> = Promise<{ data: T | null; error: ApiError }>;

// The SDK types `auth.admin` as unknown, so the used subset is declared here once.
export interface NeonAdminApi {
  createUser(input: { email: string; password: string; name: string }): ApiResult;
  listUsers(input: {
    query: {
      searchField: "email";
      searchOperator: "contains";
      searchValue: string;
      limit: number;
    };
  }): ApiResult<{ users: { id: string; email: string }[] }>;
  setUserPassword(input: { userId: string; newPassword: string }): ApiResult;
  banUser(input: { userId: string }): ApiResult;
  unbanUser(input: { userId: string }): ApiResult;
  revokeUserSessions(input: { userId: string }): ApiResult;
}

export const neonAdmin = (auth as unknown as { admin: NeonAdminApi }).admin;
