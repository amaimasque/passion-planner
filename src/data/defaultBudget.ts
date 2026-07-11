import type { BudgetCategory } from '../types/budget';

function cat(name: string, items: string[], note?: string): BudgetCategory {
  return {
    id: crypto.randomUUID(),
    name,
    ...(note ? { note } : {}),
    items: items.map((itemName) => ({
      id: crypto.randomUUID(),
      name: itemName,
      estimated: 0,
      actual: 0,
    })),
  };
}

export function buildDefaultBudget(): BudgetCategory[] {
  return [
    cat('Apparel', [
      'Wedding Rings',
      'Bridal Gown',
      'Bridal Shoes',
      'Bridal Robe',
      'Hair and Make Up',
      'Family Attire',
      "Groom's Attire",
      "Groom's Shoes",
      'Jewelry and Accessories',
    ]),
    cat('Reception', [
      'Venue',
      'Caterer',
      'Emcee',
      'Cake',
      'Light and Sounds',
      'Projector and Screen',
      'Cocktail',
    ]),
    cat('Music / Entertainment', ['Ceremony', 'Reception']),
    cat('Printing / Stationery', ['Save-the-Date', 'Wedding Invites', 'Guest Book']),
    cat('Photography', ['Pre-Nuptial Shoot', 'Photography', 'Videography', 'Photobooth']),
    cat(
      'Ceremony Essentials',
      [
        'Church',
        'Candle',
        'Second Veil',
        'Cord',
        'Arrhae / Coins',
        'Arrhae Holder',
        'Bible',
        'Pillows',
        'Officiant Stipend',
        'Documents',
        'Chairs',
      ],
      '* Excludes flowers',
    ),
    cat('Flowers', ['Entourage', 'Church']),
    cat('Gifts', [
      'Principal Sponsors (Male)',
      'Principal Sponsors (Female)',
      'Female Entourage',
      'Male Entourage',
      'Guests',
      'Kids Entourage',
      'Pastor',
      'Suppliers',
    ]),
    cat('Travel / Transportation', ['Bridal Car', 'Shuttle Service']),
    cat('Other Expenses', [
      'Wedding Coordinator',
      'Groom Accommodations',
      'Bride Accommodations',
      'Crew Meals',
      'Entourage & Family Meals during Prep',
    ]),
    cat('Honeymoon', ['Airfare', 'Terminal Fee', 'Accommodations', 'Pocket Money', 'Food']),
  ];
}
