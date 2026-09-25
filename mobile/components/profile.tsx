import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { api } from "@/lib/api";
import { createId } from "@/lib/format";
import type { ProfileSnapshot } from "@/lib/types";

const STORAGE_KEY = "recycler.profile.v1";

type StoredProfile = { id: string; displayName: string };

type ProfileContextValue = {
  ready: boolean;
  profile: StoredProfile | null;
  snapshot: ProfileSnapshot | null;
  error: string;
  refresh: () => Promise<ProfileSnapshot | null>;
  saveName: (displayName: string) => Promise<StoredProfile>;
};

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<StoredProfile | null>(null);
  const [snapshot, setSnapshot] = useState<ProfileSnapshot | null>(null);
  const [error, setError] = useState("");
  const profileRef = useRef<StoredProfile | null>(null);

  const refresh = useCallback(async () => {
    const current = profileRef.current;
    if (!current) {
      setSnapshot(null);
      return null;
    }
    const next = await api.profile(current.id);
    const stored = { id: next.id, displayName: next.displayName };
    profileRef.current = stored;
    setProfile(stored);
    setSnapshot(next);
    setError("");
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    return next;
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!raw || cancelled) return;
        const stored = JSON.parse(raw) as StoredProfile;
        if (!stored?.id || !stored.displayName) return;
        profileRef.current = stored;
        setProfile(stored);
        try {
          const next = await api.profile(stored.id);
          if (!cancelled) setSnapshot(next);
        } catch (err) {
          if (!cancelled) setError(err instanceof Error ? err.message : "Could not load your points.");
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const saveName = useCallback(
    async (displayName: string) => {
      const trimmed = displayName.trim();
      if (!trimmed) throw new Error("Display name is required.");
      const id = profile?.id ?? createId();
      const saved = await api.saveProfile(id, trimmed);
      const stored = { id: saved.id, displayName: saved.displayName };
      profileRef.current = stored;
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
      setProfile(stored);
      const next = await api.profile(stored.id);
      setSnapshot(next);
      setError("");
      return stored;
    },
    [profile?.id],
  );

  const value = useMemo(
    () => ({ ready, profile, snapshot, error, refresh, saveName }),
    [ready, profile, snapshot, error, refresh, saveName],
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const value = useContext(ProfileContext);
  if (!value) throw new Error("ProfileProvider is missing.");
  return value;
}
