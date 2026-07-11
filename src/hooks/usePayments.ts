import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import type { PaymentMap } from '../types/payment';

export function usePayments() {
  const { currentUser } = useAuth();
  const [entries, setEntries] = useState<PaymentMap>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    const ref = doc(db, 'payments', currentUser.uid);
    const unsub = onSnapshot(ref, (snap) => {
      setEntries(snap.exists() ? (snap.data().entries ?? {}) : {});
      setLoading(false);
    });
    return unsub;
  }, [currentUser]);

  const save = useCallback(async (updated: PaymentMap) => {
    if (!currentUser) return;
    const clean = JSON.parse(JSON.stringify(updated));
    await setDoc(doc(db, 'payments', currentUser.uid), { entries: clean });
  }, [currentUser]);

  return { entries, loading, save };
}
