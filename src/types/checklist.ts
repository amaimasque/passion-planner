export type ChecklistStatus   = 'pending' | 'in_progress' | 'done' | 'na';
export type ChecklistCategory = string; // built-in: 'documents' | 'ceremony' | 'reception', or any custom

export const BUILT_IN_CATEGORIES: ChecklistCategory[] = ['documents', 'ceremony', 'reception'];

export const BUILT_IN_CATEGORY_LABELS: Record<string, string> = {
  documents: 'Documents',
  ceremony:  'Ceremony',
  reception: 'Reception',
};

export interface ChecklistItem {
  id: string;
  category: ChecklistCategory;
  name: string;
  qty: number;        // 0 = unset
  targetDate: string; // ISO date
  deadline: string;   // ISO date
  status: ChecklistStatus;
  notes: string;
}

// ── Prefill data ──────────────────────────────────────────────────────────────

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

const DOCUMENTS: string[] = [
  'Entourage Processional Line Up',
  'Invitations',
  'Technical Reception Programme',
  'On the Day Timeline',
  'Participants for Games',
  'Pews Labels',
  'Photo Op Sequence',
  "Supplier's Balances",
  "Supplier's Contracts",
];

const CEREMONY: string[] = [
  'Bridal Gown',
  'Veil',
  'Secondary Veil',
  'Rings',
  'Cord',
  'Garter',
  'Bible',
  'Arrhae',
  'Candles',
  'Lighters / Matches',
  'Missalettes',
  'Boutonnaires for Groom, Male Entourage Sponsors and Fathers',
  'Corsages / Wrist Flowers for Female Entourage and Sponsors',
  'Bridal Bouquet',
  'Throwaway Bouquet',
  'Flowers for Car',
  'Bridal Car',
  'Church Flowers',
  'Flowers for Offering',
  'Baskets of Loose Petals',
  'Videographers and Photographers',
  'Singer / Musicians / Choir',
  'Hair and Make-up',
];

const RECEPTION: string[] = [
  'Audio / Songs / Music',
  'Bowl for Ball Pens',
  'Games - Pins',
  'Give-aways for Principal Sponsors',
  'Prizes for Games',
  'Programme',
  'Bottle of Wine for Toasting',
  'AVP - Pre-Nuptial',
  "Couple's Portrait Photo for Signing",
  'Doves',
  'Guest Book for Signing',
  'Laptop for Audio Visual Presentation',
  'Party Poppers',
  'Photo Booth',
  'Projectors',
  'Standees',
  'Table and Seating Arrangement',
  'Table Numbers with Names (with VIP)',
  'Wedding Cake',
  'Wide Screen',
  'AVP - Video Greetings',
  'Laptop for Sound System',
];

function makeItems(category: ChecklistCategory, names: string[]): ChecklistItem[] {
  return names.map(name => ({
    id: uid(),
    category,
    name,
    qty: 0,
    targetDate: '',
    deadline: '',
    status: 'pending',
    notes: '',
  }));
}

export function buildPrefillItems(): ChecklistItem[] {
  return [
    ...makeItems('documents', DOCUMENTS),
    ...makeItems('ceremony',  CEREMONY),
    ...makeItems('reception', RECEPTION),
  ];
}
