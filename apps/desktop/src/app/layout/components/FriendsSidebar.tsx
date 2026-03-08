import { Clock3, PanelRightClose, PanelRightOpen, UserPlus2 } from "lucide-react";
import { usePendingFriendRequestsQuery, useFriendsQuery } from "../../../features/social/queries/use-social-queries";
import { useUiStore } from "../../../features/ui/store/ui-store";
import { useI18n } from "../../../shared/i18n/i18n-provider";
import { displayName, enrichFriendPresence, formatRelativeTime } from "../../../shared/utils/ui-format";

type FriendsSidebarContentProps = {
  compact?: boolean;
  onClose?: () => void;
};

export function FriendsSidebarContent({ compact = false, onClose }: FriendsSidebarContentProps) {
  const { t, locale } = useI18n();
  const friendsQuery = useFriendsQuery();
  const pendingQuery = usePendingFriendRequestsQuery();
  const friends = friendsQuery.data ?? [];
  const pending = pendingQuery.data ?? [];

  return (
    <>
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-5">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-white/45">{t("shell.friends")}</p>
          <p className="mt-1 text-2xl font-semibold text-white">{friends.length}</p>
        </div>
        {onClose ? (
          <button
            type="button"
            className="btn btn-circle btn-ghost border border-white/10 bg-white/5"
            onClick={onClose}
            aria-label={t("shell.toggleFriends")}
          >
            <PanelRightClose size={16} />
          </button>
        ) : null}
      </div>

      <div className={`flex-1 space-y-6 overflow-y-auto px-4 py-4 ${compact ? "pb-6" : ""}`}>
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-white/45">{t("shell.friends")}</h3>
            <span className="rounded-full border border-primary/25 bg-primary/10 px-2 py-1 text-[11px] font-semibold text-primary">
              {friends.filter((friend) => enrichFriendPresence(friend).status !== "offline").length} {t("shell.online")}
            </span>
          </div>
          <div className="grid gap-2">
            {friends.map((friend) => {
              const presence = enrichFriendPresence(friend);
              const label =
                presence.status === "playing"
                  ? `${t("common.inGame")} · ${presence.game}`
                  : presence.status === "online"
                    ? t("common.onlineNow")
                    : presence.status === "away"
                      ? t("common.away")
                      : t("common.offline");

              return (
                <article key={friend.id} className="rounded-[1.5rem] border border-white/10 bg-black/10 px-3 py-3">
                  <div className="flex items-center gap-3">
                    <div className="avatar atlas-avatar-ring">
                      <div className="w-12 rounded-2xl bg-base-300">
                        {friend.avatarUrl ? <img src={friend.avatarUrl} alt={displayName(friend)} /> : null}
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-white">{displayName(friend)}</p>
                      <p className="truncate text-sm text-white/60">{label}</p>
                    </div>
                    <span
                      className={`h-3 w-3 rounded-full ${
                        presence.status === "playing"
                          ? "bg-primary"
                          : presence.status === "online"
                            ? "bg-success"
                            : presence.status === "away"
                              ? "bg-warning"
                              : "bg-white/20"
                      }`}
                    />
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center gap-2">
            <UserPlus2 size={15} className="text-primary" />
            <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-white/45">{t("shell.pendingRequests")}</h3>
          </div>
          <div className="grid gap-2">
            {pending.length === 0 ? (
              <div className="rounded-[1.5rem] border border-dashed border-white/10 px-4 py-5 text-sm text-white/50">
                {t("shell.noNotifications")}
              </div>
            ) : (
              pending.map((request) => (
                <article key={request.id} className="rounded-[1.5rem] border border-white/10 bg-black/10 px-3 py-3">
                  <div className="flex items-center gap-3">
                    <div className="avatar atlas-avatar-ring">
                      <div className="w-11 rounded-2xl bg-base-300">
                        {request.sender.avatarUrl ? (
                          <img src={request.sender.avatarUrl} alt={displayName(request.sender)} />
                        ) : null}
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-white">{displayName(request.sender)}</p>
                      <p className="text-sm text-white/55">{t("shell.requested")}</p>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] uppercase tracking-[0.16em] text-white/35">
                      <Clock3 size={12} />
                      {formatRelativeTime(request.createdAt, locale)}
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </>
  );
}

export function FriendsSidebar() {
  const { t } = useI18n();
  const rightSidebarOpen = useUiStore((state) => state.rightSidebarOpen);
  const toggleRightSidebar = useUiStore((state) => state.toggleRightSidebar);

  if (!rightSidebarOpen) {
    return (
      <button
        type="button"
        className="atlas-friends-handle btn btn-circle fixed right-4 top-1/2 z-30 hidden -translate-y-1/2 border border-white/10 bg-base-200/70 text-white shadow-2xl backdrop-blur-xl xl:flex"
        onClick={toggleRightSidebar}
        aria-label={t("shell.toggleFriends")}
      >
        <PanelRightOpen size={16} />
      </button>
    );
  }

  return (
    <aside className="atlas-glass-panel atlas-right-rail sticky top-6 hidden h-[calc(100vh-3rem)] min-h-[40rem] xl:flex xl:w-[20.5rem] xl:flex-col">
      <FriendsSidebarContent onClose={toggleRightSidebar} />
    </aside>
  );
}
