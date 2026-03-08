import { Bell, Check, CheckCheck, MessageSquareMore, Sparkles, UserPlus } from "lucide-react";
import { useI18n } from "../../../shared/i18n/i18n-provider";
import { useMarkAllNotificationsReadMutation, useMarkNotificationReadMutation, useNotificationsQuery } from "../../../features/notifications/queries/use-notifications-queries";
import { formatRelativeTime, notificationUnreadCount } from "../../../shared/utils/ui-format";

function iconForType(type: string) {
  switch (type) {
    case "friend_request":
    case "friend_accept":
      return UserPlus;
    case "chat_message":
      return MessageSquareMore;
    default:
      return Sparkles;
  }
}

export function NotificationPopover() {
  const { t, locale } = useI18n();
  const notificationsQuery = useNotificationsQuery();
  const markReadMutation = useMarkNotificationReadMutation();
  const markAllMutation = useMarkAllNotificationsReadMutation();
  const notifications = notificationsQuery.data ?? [];
  const unread = notificationUnreadCount(notifications);

  return (
    <details className="dropdown dropdown-end">
      <summary className="btn btn-circle btn-ghost border border-white/10 bg-white/5 text-white hover:bg-white/10">
        <div className="indicator">
          <Bell size={18} />
          {unread > 0 ? <span className="badge badge-xs badge-primary indicator-item">{unread}</span> : null}
        </div>
      </summary>

      <div className="dropdown-content mt-3 w-[22rem] rounded-[1.75rem] border border-white/12 bg-base-200/95 p-3 shadow-2xl backdrop-blur-xl">
        <div className="mb-3 flex items-center justify-between gap-3 px-2">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/45">{t("shell.notifications")}</p>
            <p className="text-xs text-white/55">{unread} unread</p>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-xs rounded-full"
            onClick={() => void markAllMutation.mutateAsync()}
            disabled={markAllMutation.isPending || unread === 0}
          >
            <CheckCheck size={14} />
            {t("shell.markAllRead")}
          </button>
        </div>

        <div className="grid max-h-[28rem] gap-2 overflow-y-auto pr-1">
          {notifications.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-white/55">
              {t("shell.noNotifications")}
            </div>
          ) : (
            notifications.map((notification) => {
              const Icon = iconForType(notification.type);
              return (
                <article
                  key={notification.id}
                  className={`rounded-[1.5rem] border px-3 py-3 transition ${
                    notification.readAt
                      ? "border-white/8 bg-black/10 text-white/70"
                      : "border-primary/30 bg-primary/10 text-white"
                  }`}
                >
                  <div className="flex gap-3">
                    <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/8">
                      <Icon size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-semibold leading-tight">{notification.title}</h4>
                          <p className="mt-1 text-sm text-white/65">{notification.message}</p>
                        </div>
                        {!notification.readAt ? (
                          <button
                            type="button"
                            className="btn btn-ghost btn-xs rounded-full"
                            onClick={() => void markReadMutation.mutateAsync(notification.id)}
                            disabled={markReadMutation.isPending}
                          >
                            <Check size={14} />
                          </button>
                        ) : null}
                      </div>
                      <p className="mt-3 text-xs uppercase tracking-[0.18em] text-white/35">
                        {formatRelativeTime(notification.createdAt, locale)}
                      </p>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </div>
    </details>
  );
}
