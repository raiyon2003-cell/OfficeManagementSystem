import { resolveParams } from "@/lib/api/helpers";
import { success, error } from "@/lib/api-response";
import { withAuth } from "@/lib/middleware/auth-middleware";
import { markAsRead } from "@/lib/services/notification.service";

export const PATCH = withAuth(async (_request, { user, params }) => {
  const { id } = await resolveParams(params);
  const notification = await markAsRead(id, user.id);

  if (!notification) {
    return error("Notification not found", { code: "NOT_FOUND", status: 404 });
  }

  return success(notification, { message: "Notification marked as read" });
});
