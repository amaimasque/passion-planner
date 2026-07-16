export interface PublicAttireSet {
  top: string;
  bottom: string;
  shoes: string;
}

export interface PublicGuestAttire {
  genderSplit: boolean;
  unisex: PublicAttireSet;
  men: PublicAttireSet;
  women: PublicAttireSet;
}

export interface PublicSeatingTable {
  name: string;
  guestNames: string[];
  notes: string;
}

export interface PublicProcessionalMember {
  name: string;
  remarks: string;
}

export interface PublicProcessionalPair {
  leftName: string;
  rightName: string;
  remarks: string;
}

export interface PublicProcessionalRole {
  name: string;
  subtitle: string;
  remarks: string;
  layout: 'single' | 'paired';
  leftLabel: string;
  rightLabel: string;
  members: PublicProcessionalMember[];
  pairs: PublicProcessionalPair[];
}

export interface PublicRoleAttire {
  roleName: string;
  attire: PublicGuestAttire;
}

export interface WeddingWebsiteData {
  uid: string;
  slug: string;
  groomFirstName: string;
  groomLastName: string;
  groomNickname: string;
  brideFirstName: string;
  brideLastName: string;
  brideNickname: string;
  date: string;
  ceremonyTime: string;
  churchAndAddress: string;
  receptionVenue: string;
  receptionStartTime: string;
  motifColors: { hex: string; name: string }[];
  theme: string;
  eventHashtag: string;
  attire: string;
  guestAttire: PublicGuestAttire;
  roleAttires: PublicRoleAttire[];
  foodServiceType: string;
  programFlow: { time: string; title: string; description?: string; section: string }[];
  processional: PublicProcessionalRole[];
  seating: PublicSeatingTable[];
  heroPhotoUrl: string;
  publishedAt: string;
}
