import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import type { ChecklistItem } from '../types/checklist';

export function useChecklist() {
  const { currentUser } = useAuth();
  const [items, setItems]   = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    const ref = doc(db, 'checklists', currentUser.uid);
    const unsub = onSnapshot(ref, snap => {
      setItems(snap.exists() ? (snap.data().items ?? []) : []);
      setLoading(false);
    });
    return unsub;
  }, [currentUser]);

  const save = useCallback(async (updated: ChecklistItem[]) => {
    if (!currentUser) return;
    const clean = JSON.parse(JSON.stringify(updated));
    await setDoc(doc(db, 'checklists', currentUser.uid), { items: clean });
  }, [currentUser]);

  return { items, loading, save };
}
