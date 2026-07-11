import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

export interface UserProfile {
  nickname?: string;
  currency?: string;
  location?: string;
}

export function useUserProfile() {
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    const unsub = onSnapshot(doc(db, 'users', currentUser.uid), (snap) => {
      setProfile(snap.exists() ? (snap.data() as UserProfile) : {});
      setLoading(false);
    });
    return unsub;
  }, [currentUser]);

  const saveProfile = useCallback(async (data: UserProfile) => {
    if (!currentUser) return;
    await setDoc(doc(db, 'users', currentUser.uid), data, { merge: true });
  }, [currentUser]);

  return { profile, loading, saveProfile };
}
