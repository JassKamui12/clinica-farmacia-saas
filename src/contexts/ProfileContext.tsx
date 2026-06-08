'use client';

import { createContext, useContext, useEffect, useState, useCallback } from "react";

export interface ClinicProfile {
  id: string;
  name: string;
  rubroId: string;
  plan: string;
  trialEndsAt: string | null;
  slug: string;
  logoUrl: string | null;
  whatsappPhone: string | null;
}

export interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  role: string;
  isSuperAdmin: boolean;
  specialty: string | null;
  logoUrl: string | null;
  whatsappPhone: string | null;
  clinicId: string | null;
  clinic: ClinicProfile | null;
}

interface ProfileContextValue {
  profile: UserProfile | null;
  loading: boolean;
  refresh: () => void;
}

const ProfileContext = createContext<ProfileContextValue>({
  profile: null,
  loading: true,
  refresh: () => {},
});

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      } else {
        setProfile(null);
      }
    } catch {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <ProfileContext.Provider value={{ profile, loading, refresh }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  return useContext(ProfileContext);
}
