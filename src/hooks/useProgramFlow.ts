import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

export const BUILT_IN_SECTIONS = ['ceremony', 'cocktail', 'reception'];

export interface ProgramItem {
  id: string;
  time: string;
  title: string;
  description?: string;
  section: string; // built-in: 'ceremony' | 'cocktail' | 'reception', or any custom name
}

export function useProgramFlow() {
  const { currentUser } = useAuth();
  const [items, setItems] = useState<ProgramItem[]>([]);
  const [customSections, setCustomSections] = useState<string[]>([]);
  const [sectionOrder, setSectionOrder] = useState<string[]>([...BUILT_IN_SECTIONS]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    const ref = doc(db, 'program-flows', currentUser.uid);
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setItems(data.items ?? []);
        const cs: string[] = data.customSections ?? [];
        setCustomSections(cs);
        const storedOrder: string[] = data.sectionOrder ?? [];
        const allSections = [...BUILT_IN_SECTIONS, ...cs];
        // Merge: keep stored order, append any new sections not yet in it
        const order = [
          ...storedOrder.filter(s => allSections.includes(s)),
          ...allSections.filter(s => !storedOrder.includes(s)),
        ];
        setSectionOrder(order.length > 0 ? order : [...BUILT_IN_SECTIONS]);
      } else {
        setItems([]);
        setCustomSections([]);
        setSectionOrder([...BUILT_IN_SECTIONS]);
      }
      setLoading(false);
    });
    return unsub;
  }, [currentUser]);

  const saveAll = useCallback(async (
    updItems: ProgramItem[],
    cs: string[],
    so: string[],
  ) => {
    if (!currentUser) return;
    await setDoc(doc(db, 'program-flows', currentUser.uid), {
      items: updItems,
      customSections: cs,
      sectionOrder: so,
    });
  }, [currentUser]);

  const save = useCallback(async (updated: ProgramItem[], sections?: string[]) => {
    const cs = sections ?? customSections;
    await saveAll(updated, cs, sectionOrder);
  }, [currentUser, customSections, sectionOrder, saveAll]);

  const saveCustomSections = useCallback(async (sections: string[]) => {
    // Update sectionOrder: keep existing order, append new, remove deleted
    const allSections = [...BUILT_IN_SECTIONS, ...sections];
    const newOrder = [
      ...sectionOrder.filter(s => allSections.includes(s)),
      ...sections.filter(s => !sectionOrder.includes(s)),
    ];
    await saveAll(items, sections, newOrder);
  }, [currentUser, items, sectionOrder, saveAll]);

  const saveSectionOrder = useCallback(async (order: string[]) => {
    await saveAll(items, customSections, order);
  }, [currentUser, items, customSections, saveAll]);

  return { items, customSections, sectionOrder, loading, save, saveCustomSections, saveSectionOrder };
}
