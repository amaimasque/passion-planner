import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import type { WeddingDetails } from '../types/weddingDetails';
import { EMPTY_WEDDING_DETAILS } from '../types/weddingDetails';

export function useWeddingDetails() {
  const { currentUser } = useAuth();
  const [details, setDetails] = useState<WeddingDetails>(EMPTY_WEDDING_DETAILS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    const ref = doc(db, 'weddings', currentUser.uid);
    const unsub = onSnapshot(ref, (snap) => {
      setDetails(snap.exists() ? { ...EMPTY_WEDDING_DETAILS, ...snap.data() } : EMPTY_WEDDING_DETAILS);
      setLoading(false);
    });
    return unsub;
  }, [currentUser]);

  const save = useCallback(async (updated: WeddingDetails) => {
    if (!currentUser) return;
    const clean = JSON.parse(JSON.stringify(updated));
    await setDoc(doc(db, 'weddings', currentUser.uid), clean);
  }, [currentUser]);

  return { details, loading, save };
}
