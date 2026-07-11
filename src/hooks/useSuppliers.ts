import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import type { Supplier } from '../types/supplier';

export function useSuppliers() {
  const { currentUser } = useAuth();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    const ref = doc(db, 'suppliers', currentUser.uid);
    const unsub = onSnapshot(ref, (snap) => {
      setSuppliers(snap.exists() ? (snap.data().suppliers ?? []) : []);
      setLoading(false);
    });
    return unsub;
  }, [currentUser]);

  const save = useCallback(async (updated: Supplier[]) => {
    if (!currentUser) return;
    // Firestore rejects `undefined` values — strip them before writing
    const clean = JSON.parse(JSON.stringify(updated));
    await setDoc(doc(db, 'suppliers', currentUser.uid), { suppliers: clean });
  }, [currentUser]);

  return { suppliers, loading, save };
}
