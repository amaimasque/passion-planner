import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import type { ProcessionalRole } from '../types/processional';

export function useProcessional() {
  const { currentUser } = useAuth();
  const [roles, setRoles] = useState<ProcessionalRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    const ref = doc(db, 'processional', currentUser.uid);
    const unsub = onSnapshot(ref, (snap) => {
      setRoles(snap.exists() ? (snap.data().roles ?? []) : []);
      setLoading(false);
    });
    return unsub;
  }, [currentUser]);

  const save = useCallback(async (updated: ProcessionalRole[]) => {
    if (!currentUser) return;
    const clean = JSON.parse(JSON.stringify(updated));
    await setDoc(doc(db, 'processional', currentUser.uid), { roles: clean });
  }, [currentUser]);

  return { roles, loading, save };
}
