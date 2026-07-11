export interface SeatingTable {
  id: string;
  name: string;
  capacity: number;   // 0 = no limit
  guestIds: string[];
  notes: string;
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function buildPrefillTables(): SeatingTable[] {
  return [
    { id: uid(), name: 'VIP Table 1', capacity: 0, guestIds: [], notes: '' },
    { id: uid(), name: 'Table 1',     capacity: 0, guestIds: [], notes: '' },
  ];
}
