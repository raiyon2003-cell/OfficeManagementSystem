import { success } from "@/lib/api-response";
import { withAuth } from "@/lib/middleware/auth-middleware";
import { markAllAsRead } from "@/lib/services/notification.service";

export const PATCH = withAuth(async (_request, { user }) => {
  const result = await markAllAsRead(user.id);
  return success(
    { updated: result.count },
    { message: "All notifications marked as read" },
  );
});
