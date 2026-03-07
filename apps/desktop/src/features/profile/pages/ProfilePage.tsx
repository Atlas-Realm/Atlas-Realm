import { useEffect, useState } from "react";
import { useAuthMeQuery, useLogoutMutation } from "../../auth/queries/use-auth-queries";
import { useProfileQuery, useUpdateProfileMutation } from "../queries/use-profile-queries";

export default function ProfilePage() {
  const { data: authUser } = useAuthMeQuery();
  const profileQuery = useProfileQuery();
  const updateProfileMutation = useUpdateProfileMutation();
  const logoutMutation = useLogoutMutation();

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!profileQuery.data) {
      return;
    }

    setDisplayName(profileQuery.data.displayName || "");
    setBio(profileQuery.data.bio || "");
    setAvatarUrl(profileQuery.data.avatarUrl || "");
  }, [profileQuery.data]);

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);

    try {
      await updateProfileMutation.mutateAsync({
        displayName: displayName || null,
        bio: bio || null,
        avatarUrl: avatarUrl || null,
      });
      setMessage("Profile updated");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Profile update failed");
    }
  };

  return (
    <div className="grid gap-6">
      <section className="card bg-base-200 border border-base-300 shadow-xl">
        <div className="card-body md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="avatar">
              <div className="w-20 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                <img
                  src={
                    avatarUrl ||
                    profileQuery.data?.avatarUrl ||
                    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=160&q=80"
                  }
                  alt={authUser?.username || "avatar"}
                />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold">{profileQuery.data?.displayName || authUser?.username || "Profile"}</h2>
              <p className="opacity-70 text-sm">{authUser?.email}</p>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-error btn-outline"
            onClick={() => void logoutMutation.mutateAsync()}
            disabled={logoutMutation.isPending}
          >
            {logoutMutation.isPending ? "Logging out" : "Logout"}
          </button>
        </div>
      </section>

      <section className="card bg-base-200 border border-base-300 shadow-xl">
        <div className="card-body gap-4">
          <h2 className="card-title text-2xl">Edit Profile</h2>

          {profileQuery.isPending ? (
            <div className="w-full grid place-items-center py-8">
              <span className="loading loading-spinner loading-md text-primary" aria-hidden="true" />
            </div>
          ) : (
            <form className="grid gap-3" onSubmit={handleSave}>
              <label className="form-control gap-1">
                <span className="label-text">Display Name</span>
                <input
                  className="input input-bordered"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  maxLength={64}
                />
              </label>

              <label className="form-control gap-1">
                <span className="label-text">Bio</span>
                <textarea
                  className="textarea textarea-bordered"
                  value={bio}
                  onChange={(event) => setBio(event.target.value)}
                  maxLength={280}
                  rows={4}
                />
              </label>

              <label className="form-control gap-1">
                <span className="label-text">Avatar URL</span>
                <input
                  className="input input-bordered"
                  value={avatarUrl}
                  onChange={(event) => setAvatarUrl(event.target.value)}
                  type="url"
                />
              </label>

              <button type="submit" className="btn btn-primary" disabled={updateProfileMutation.isPending}>
                {updateProfileMutation.isPending ? "Saving" : "Save"}
              </button>
            </form>
          )}

          {message ? <div className="alert alert-info py-2 text-sm">{message}</div> : null}
          {profileQuery.error ? (
            <div role="alert" className="alert alert-error py-2 text-sm">
              <span>{profileQuery.error instanceof Error ? profileQuery.error.message : "Profile fetch failed"}</span>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
