import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import type { Guest } from '../types/guest';

export function useGuests() {
  const { currentUser } = useAuth();
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    const ref = doc(db, 'guests', currentUser.uid);
    const unsub = onSnapshot(ref, (snap) => {
      setGuests(snap.exists() ? (snap.data().guests ?? []) : []);
      setLoading(false);
    });
    return unsub;
  }, [currentUser]);

  const save = useCallback(async (updated: Guest[]) => {
    if (!currentUser) return;
    const clean = JSON.parse(JSON.stringify(updated));
    await setDoc(doc(db, 'guests', currentUser.uid), { guests: clean });
  }, [currentUser]);

  return { guests, loading, save };
}
