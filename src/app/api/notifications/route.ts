import { paginated } from "@/lib/api-response";
import { parseSearchParams } from "@/lib/api/helpers";
import { withAuth } from "@/lib/middleware/auth-middleware";
import { listNotificationsSchema } from "@/lib/validations/notifications";
import { getUserNotifications } from "@/lib/services/notification.service";

export const GET = withAuth(async (request, { user }) => {
  const parsed = parseSearchParams(request, listNotificationsSchema);
  if (!parsed.success) return parsed.response;

  const { page, limit, unreadOnly } = parsed.data;
  const result = await getUserNotifications(user.id, {
    page,
    limit,
    unreadOnly,
  });

  return paginated(result.data, {
    page: result.page,
    limit: result.limit,
    total: result.total,
  });
});
