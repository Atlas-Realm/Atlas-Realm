import { SendHorizonal } from "lucide-react";
import { useMemo, useState } from "react";
import { useAuthMeQuery } from "../../auth/queries/use-auth-queries";
import { useProfileQuery } from "../../profile/queries/use-profile-queries";
import { useFriendsQuery } from "../../social/queries/use-social-queries";
import { useI18n } from "../../../shared/i18n/i18n-provider";
import { mapActivitiesToFeedItems, formatRelativeTime } from "../../../shared/utils/ui-format";
import { useActivityFeedQuery, useMyActivityQuery } from "../queries/use-activity-queries";
import { useActivityStore } from "../store/activity-store";

export default function ActivityPage() {
  const { t, locale } = useI18n();
  const authQuery = useAuthMeQuery();
  const profileQuery = useProfileQuery();
  const friendsQuery = useFriendsQuery();
  const feedQuery = useActivityFeedQuery();
  const myFeedQuery = useMyActivityQuery();
  const localPosts = useActivityStore((state) => state.localPosts);
  const addLocalPost = useActivityStore((state) => state.addLocalPost);

  const [activeTab, setActiveTab] = useState<"feed" | "me">("feed");
  const [draft, setDraft] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  const profile = profileQuery.data;
  const feedItems = useMemo(() => {
    return mapActivitiesToFeedItems({
      activities: activeTab === "feed" ? feedQuery.data ?? [] : myFeedQuery.data ?? [],
      localPosts,
      friends: friendsQuery.data ?? [],
      me: profile,
    });
  }, [activeTab, feedQuery.data, myFeedQuery.data, localPosts, friendsQuery.data, profile]);

  const handlePost = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed || !authQuery.data) return;

    // TODO(api-gap): replace local post insertion with a real text activity create endpoint when backend is ready.
    addLocalPost({
      actorId: authQuery.data.id,
      actorName: profile?.displayName || authQuery.data.username,
      actorAvatarUrl: profile?.avatarUrl ?? authQuery.data.avatarUrl,
      body: trimmed,
    });
    setDraft("");
    setNotice(t("activity.localNotice"));
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
      <section className="grid gap-6">
        <article className="atlas-glass-panel p-5 md:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-white/45">{t("activity.title")}</p>
              <h1 className="mt-2 text-3xl font-semibold text-white">{t("activity.subtitle")}</h1>
            </div>
            <div className="inline-flex rounded-full border border-white/10 bg-black/10 p-1">
              <button type="button" className={`atlas-icon-switch px-4 ${activeTab === "feed" ? "is-active" : ""}`} onClick={() => setActiveTab("feed")}>
                {t("activity.feed")}
              </button>
              <button type="button" className={`atlas-icon-switch px-4 ${activeTab === "me" ? "is-active" : ""}`} onClick={() => setActiveTab("me")}>
                {t("activity.mine")}
              </button>
            </div>
          </div>

          <form onSubmit={handlePost} className="rounded-[1.75rem] border border-white/10 bg-black/10 p-4 md:p-5">
            <textarea
              className="min-h-32 w-full resize-none border-0 bg-transparent text-base text-white outline-none placeholder:text-white/35"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={t("activity.placeholder")}
              maxLength={280}
            />
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
              <span className="text-sm text-white/45">{t("activity.visibility")}</span>
              <button type="submit" className="btn atlas-primary-btn" disabled={draft.trim().length === 0}>
                <SendHorizonal size={16} />
                {t("activity.post")}
              </button>
            </div>
          </form>

          {notice ? <div className="alert alert-info mt-4 rounded-[1.25rem] border border-primary/20 bg-primary/10 text-sm text-white/80">{notice}</div> : null}
        </article>

        <div className="grid gap-4">
          {(feedQuery.isPending && activeTab === "feed") || (myFeedQuery.isPending && activeTab === "me") ? (
            <div className="atlas-empty-state">{t("common.loading")}...</div>
          ) : feedItems.length === 0 ? (
            <div className="atlas-empty-state">{t("activity.empty")}</div>
          ) : (
            feedItems.map((item) => {
              const reactions = (item.actorId.charCodeAt(0) % 45) + 8;
              const comments = (item.actorId.charCodeAt(1) % 10) + 1;

              return (
                <article key={item.id} className="atlas-glass-panel p-5 md:p-6">
                  <div className="flex items-start gap-4">
                    <div className="avatar atlas-avatar-ring">
                      <div className="w-14 rounded-2xl bg-base-300">
                        {item.actorAvatarUrl ? <img src={item.actorAvatarUrl} alt={item.actorName} /> : null}
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="text-xl font-semibold text-white">{item.actorName}</h3>
                          <p className="mt-1 text-xs uppercase tracking-[0.22em] text-white/35">
                            {formatRelativeTime(item.createdAt, locale)} • {item.accentLabel}
                          </p>
                        </div>
                        <span className={`atlas-pill ${item.source === "local" ? "text-primary" : "text-white/55"}`}>{item.title}</span>
                      </div>
                      <p className="mt-4 text-base leading-8 text-white/78">{item.body}</p>
                      <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-white/45">
                        <span>{reactions} {t("activity.likes")}</span>
                        <span>{comments} {t("activity.comments")}</span>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>

      <aside className="atlas-glass-panel p-5 md:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.26em] text-white/45">{t("activity.mine")}</p>
        <div className="mt-4 grid gap-3">
          {localPosts.slice(0, 4).map((post) => (
            <div key={post.id} className="rounded-[1.5rem] border border-white/10 bg-black/10 px-4 py-4">
              <p className="text-sm text-white/80">{post.body}</p>
              <p className="mt-2 text-xs uppercase tracking-[0.2em] text-white/35">{formatRelativeTime(post.createdAt, locale)}</p>
            </div>
          ))}
          {localPosts.length === 0 ? <div className="atlas-empty-state">{t("activity.localNotice")}</div> : null}
        </div>
      </aside>
    </div>
  );
}
