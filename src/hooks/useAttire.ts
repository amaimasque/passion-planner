import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import type { AttireData, RoleAttire } from '../types/attire';

const EMPTY_SET = { top: '', bottom: '', shoes: '' };

export const EMPTY_ROLE_ATTIRE: RoleAttire = {
  genderSplit: false,
  unisex: EMPTY_SET,
  men: EMPTY_SET,
  women: EMPTY_SET,
};

const EMPTY_DATA: AttireData = {
  defaultGuestAttire: EMPTY_ROLE_ATTIRE,
  roleAttire: {},
};

export function useAttire() {
  const { currentUser } = useAuth();
  const [data, setData] = useState<AttireData>(EMPTY_DATA);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    const ref = doc(db, 'attire', currentUser.uid);
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setData({
          defaultGuestAttire: d.defaultGuestAttire ?? EMPTY_ROLE_ATTIRE,
          roleAttire: d.roleAttire ?? {},
        });
      } else {
        setData(EMPTY_DATA);
      }
      setLoading(false);
    });
    return unsub;
  }, [currentUser]);

  const saveDefaultAttire = useCallback(async (attire: RoleAttire) => {
    if (!currentUser) return;
    await setDoc(doc(db, 'attire', currentUser.uid), { defaultGuestAttire: attire }, { merge: true });
  }, [currentUser]);

  const saveRoleAttire = useCallback(async (roleId: string, attire: RoleAttire) => {
    if (!currentUser) return;
    await setDoc(doc(db, 'attire', currentUser.uid), {
      roleAttire: { [roleId]: attire },
    }, { merge: true });
  }, [currentUser]);

  return { data, loading, saveDefaultAttire, saveRoleAttire };
}
