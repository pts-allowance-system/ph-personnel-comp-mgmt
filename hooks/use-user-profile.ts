import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store/auth-store';
import type { UserProfile } from '@/lib/models';

export function useUserProfile() {
  const { user } = useAuthStore();
  const userId = user?.id;
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      if (!userId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/users/${userId}/profile`);
        if (!response.ok) {
          throw new Error(`Failed to fetch user profile: ${response.statusText}`);
        }
        const data: UserProfile = await response.json();
        setProfile(data);
      } catch (e) {
        setError(e instanceof Error ? e : new Error('An unknown error occurred'));
      } finally {
        setIsLoading(false);
      }
    }

    fetchProfile();
  }, [userId]);

  return { profile, isLoading, error };
}
