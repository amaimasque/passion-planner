export interface SupplierAttachment {
  id: string;
  name: string;
  url: string;
  contentType: string;
  storagePath: string;
  uploadedAt: number; // epoch ms
}

export interface Supplier {
  id: string;
  name: string;
  itemIds: string[]; // references BudgetItem.id
  // Contact person — split name (legacy `contact` string may still exist in stored data)
  contactFirstName?: string;
  contactMiddleInitial?: string;
  contactLastName?: string;
  contactSuffix?: string;
  contactGuestId?: string;  // linked Guest.id when added to guest list
  phone?: string;
  email?: string;
  website?: string;
  bankName?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
  notes?: string;
  attachments?: SupplierAttachment[];
}

/** Compose a display name for the supplier's contact person. */
export function contactDisplayName(s: Supplier): string {
  const first = s.contactFirstName?.trim() ?? '';
  const mi    = s.contactMiddleInitial?.trim() ?? '';
  const last  = s.contactLastName?.trim() ?? '';
  const suf   = s.contactSuffix?.trim() ?? '';
  if (!first && !last) return (s as any).contact ?? ''; // backward compat
  const parts = [first, mi ? mi + '.' : '', last].filter(Boolean).join(' ');
  return suf ? `${parts}, ${suf}` : parts;
}
