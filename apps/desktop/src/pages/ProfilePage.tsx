import { useEffect, useState } from "react";
import { usersApi } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import type { UserProfile } from "../types";

export default function ProfilePage() {
  const { user, logout, refreshUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const me = await usersApi.me();
        setProfile(me);
        setDisplayName(me.displayName || "");
        setBio(me.bio || "");
        setAvatarUrl(me.avatarUrl || "");
      } catch {
        setMessage("Profile fetch failed");
      }
    };

    void load();
  }, []);

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setMessage(null);

    try {
      await usersApi.updateMe({
        displayName: displayName || null,
        bio: bio || null,
        avatarUrl: avatarUrl || null,
      });
      await refreshUser();
      setMessage("Profile updated");
    } catch (saveError) {
      setMessage(saveError instanceof Error ? saveError.message : "Profile update failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="profile-page">
      <section className="panel profile-header">
        <div className="profile-avatar-large">
          <img
            src={
              avatarUrl ||
              profile?.avatarUrl ||
              "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=160&q=80"
            }
            alt={user?.username || "avatar"}
          />
        </div>
        <div>
          <h2>{profile?.displayName || user?.username || "Profile"}</h2>
          <p>{user?.email}</p>
          <button type="button" className="danger-btn" onClick={() => void logout()}>
            Logout
          </button>
        </div>
      </section>

      <section className="panel">
        <h2>Edit Profile</h2>
        <form onSubmit={handleSave} className="profile-form">
          <label>
            Display Name
            <input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              maxLength={64}
            />
          </label>

          <label>
            Bio
            <textarea
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              maxLength={280}
              rows={4}
            />
          </label>

          <label>
            Avatar URL
            <input
              value={avatarUrl}
              onChange={(event) => setAvatarUrl(event.target.value)}
              type="url"
            />
          </label>

          <button type="submit" disabled={busy}>
            {busy ? "Saving..." : "Save"}
          </button>
        </form>

        {message ? <p className="info-text">{message}</p> : null}
      </section>
    </div>
  );
}
