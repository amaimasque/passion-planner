import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import type { ChecklistItem } from '../types/checklist';
import { BUILT_IN_CATEGORIES } from '../types/checklist';

export function useChecklist() {
  const { currentUser } = useAuth();
  const [items, setItems]                     = useState<ChecklistItem[]>([]);
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [loading, setLoading]                 = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    const ref = doc(db, 'checklists', currentUser.uid);
    const unsub = onSnapshot(ref, snap => {
      if (snap.exists()) {
        const data = snap.data();
        setItems(data.items ?? []);
        setCustomCategories(data.customCategories ?? []);
      } else {
        setItems([]);
        setCustomCategories([]);
      }
      setLoading(false);
    });
    return unsub;
  }, [currentUser]);

  const saveAll = useCallback(async (updItems: ChecklistItem[], cats: string[]) => {
    if (!currentUser) return;
    const clean = JSON.parse(JSON.stringify(updItems));
    await setDoc(doc(db, 'checklists', currentUser.uid), { items: clean, customCategories: cats });
  }, [currentUser]);

  const save = useCallback(async (updated: ChecklistItem[]) => {
    if (!currentUser) return;
    const clean = JSON.parse(JSON.stringify(updated));
    await setDoc(doc(db, 'checklists', currentUser.uid), { items: clean, customCategories });
  }, [currentUser, customCategories]);

  const saveCustomCategories = useCallback(async (cats: string[]) => {
    await saveAll(items, cats);
  }, [items, saveAll]);

  const allCategories = [...BUILT_IN_CATEGORIES, ...customCategories];

  return { items, customCategories, allCategories, loading, save, saveCustomCategories, saveAll };
}
