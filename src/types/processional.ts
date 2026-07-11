export type ProcessionalLayout = 'single' | 'paired';

export interface ProcessionalMember {
  id: string;
  guestId: string;  // empty string = free text entry
  name: string;     // free-text name (used when guestId is empty)
  remarks: string;
}

export interface ProcessionalPair {
  id: string;
  leftGuestId: string;
  leftName: string;
  rightGuestId: string;
  rightName: string;
  remarks: string;
}

export interface ProcessionalRole {
  id: string;
  name: string;
  subtitle: string;
  remarks: string;      // group-level remark shown on the role header row
  layout: ProcessionalLayout;
  leftLabel: string;    // e.g. "TEAM GROOM" (paired only)
  rightLabel: string;   // e.g. "TEAM BRIDE" (paired only)
  members: ProcessionalMember[];
  pairs: ProcessionalPair[];
}
