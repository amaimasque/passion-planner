export interface MotifColor {
  hex: string;
  name: string; // optional label, e.g. "Royal Blue"
}

export interface BrideGroomInfo {
  guestId: string;       // links to a guest record (auto-managed)
  firstName: string;
  lastName: string;
  middleInitial: string; // optional
  suffix: string;        // optional, e.g. "Jr.", "III"
  nickname: string;      // optional, shown instead of first name on website
  email: string;
  phone: string;
}

const EMPTY_BRIDE_GROOM: BrideGroomInfo = {
  guestId: '', firstName: '', lastName: '',
  middleInitial: '', suffix: '', nickname: '', email: '', phone: '',
};

export interface WeddingDetails {
  bride: BrideGroomInfo;
  groom: BrideGroomInfo;
  date: string;
  guestCount: number;
  motifColors: MotifColor[];
  theme: string;
  churchAndAddress: string;
  ceremonyTime: string;
  officiantGuestId: string;   // Guest.id from guest list
  receptionVenue: string;
  receptionStartTime: string;
  foodServiceType: string;
  receptionHostGuestId: string;   // Guest.id from guest list
  coordinatorGuestIds: string[];  // Guest.id[] from guest list
  weddingWebsite: string;
  eventHashtag: string;
  attire: string;
}

export const EMPTY_WEDDING_DETAILS: WeddingDetails = {
  bride: { ...EMPTY_BRIDE_GROOM },
  groom: { ...EMPTY_BRIDE_GROOM },
  date: '',
  guestCount: 0,
  motifColors: [],
  theme: '',
  churchAndAddress: '',
  ceremonyTime: '',
  officiantGuestId: '',
  receptionVenue: '',
  receptionStartTime: '',
  foodServiceType: '',
  receptionHostGuestId: '',
  coordinatorGuestIds: [],
  weddingWebsite: '',
  eventHashtag: '',
  attire: '',
};
