export type RsvpStatus = 'pending' | 'confirmed' | 'declined';
export type MealPreference = 'standard' | 'vegetarian' | 'vegan' | 'halal' | 'other';
export type GuestGroup = 'family' | 'friends' | 'work' | 'church' | 'other';

export interface Guest {
  id: string;
  firstName: string;
  lastName: string;
  middleInitial: string; // optional — store empty string if not provided
  suffix: string;        // optional — e.g. "Jr.", "III"
  email?: string;
  phone?: string;
  rsvp: RsvpStatus;
  meal: MealPreference;
  group: GuestGroup;
  slots: number; // seats allocated (includes the guest themselves)
  notes?: string;
  isChild?: boolean;
  // RSVP email tracking
  rsvpToken?: string;        // active invite token
  rsvpEmailSentAt?: number;  // epoch ms — when invite email was last sent
  rsvpRespondedAt?: number;  // epoch ms — when guest submitted their response
}

export function guestDisplayName(g: Guest): string {
  const parts = [g.firstName.trim()];
  if (g.middleInitial.trim()) parts.push(g.middleInitial.trim() + '.');
  parts.push(g.lastName.trim());
  const base = parts.filter(Boolean).join(' ');
  return g.suffix.trim() ? `${base}, ${g.suffix.trim()}` : base;
}
