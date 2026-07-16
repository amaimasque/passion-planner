export interface AttireSet {
  top: string;
  bottom: string;
  shoes: string;
}

export interface RoleAttire {
  genderSplit: boolean;
  unisex: AttireSet;
  men: AttireSet;
  women: AttireSet;
}

export interface AttireData {
  defaultGuestAttire: RoleAttire;
  roleAttire: Record<string, RoleAttire>; // keyed by ProcessionalRole.id
}
