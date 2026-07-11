import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import type { BudgetCategory } from '../types/budget';

export function useBudget() {
  const { currentUser } = useAuth();
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    const ref = doc(db, 'budgets', currentUser.uid);
    const unsub = onSnapshot(ref, (snap) => {
      setCategories(snap.exists() ? (snap.data().categories ?? []) : []);
      setLoading(false);
    });
    return unsub;
  }, [currentUser]);

  const save = useCallback(async (updated: BudgetCategory[]) => {
    if (!currentUser) return;
    await setDoc(doc(db, 'budgets', currentUser.uid), { categories: updated });
  }, [currentUser]);

  return { categories, loading, save };
}
