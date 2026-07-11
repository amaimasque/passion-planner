import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import type { SeatingTable } from '../types/seating';

export function useSeating() {
  const { currentUser } = useAuth();
  const [tables, setTables]   = useState<SeatingTable[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    const ref = doc(db, 'seating', currentUser.uid);
    const unsub = onSnapshot(ref, snap => {
      setTables(snap.exists() ? (snap.data().tables ?? []) : []);
      setLoading(false);
    });
    return unsub;
  }, [currentUser]);

  const save = useCallback(async (updated: SeatingTable[]) => {
    if (!currentUser) return;
    const clean = JSON.parse(JSON.stringify(updated));
    await setDoc(doc(db, 'seating', currentUser.uid), { tables: clean });
  }, [currentUser]);

  return { tables, loading, save };
}
