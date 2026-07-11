import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

export interface ProgramItem {
  id: string;
  time: string;
  title: string;
  description?: string;
  section: 'ceremony' | 'cocktail' | 'reception';
}

export function useProgramFlow() {
  const { currentUser } = useAuth();
  const [items, setItems] = useState<ProgramItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    const ref = doc(db, 'program-flows', currentUser.uid);
    const unsub = onSnapshot(ref, (snap) => {
      setItems(snap.exists() ? (snap.data().items ?? []) : []);
      setLoading(false);
    });
    return unsub;
  }, [currentUser]);

  const save = useCallback(async (updated: ProgramItem[]) => {
    if (!currentUser) return;
    await setDoc(doc(db, 'program-flows', currentUser.uid), { items: updated });
  }, [currentUser]);

  return { items, loading, save };
}
