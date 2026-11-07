// Single source of truth for every business fact shown on the page.
// Nothing here is invented: unknown details (deposits, delivery fees,
// capacities, policies, availability) are intentionally left out.

export const business = {
  name: 'Leaps of Laughter LLC',
  shortName: 'Leaps of Laughter',
  kind: 'Party rentals',
  city: 'Plant City, FL',
  address: '603 Spruce Street, Plant City, FL 33563',
  tagline: 'From bounce houses to tables and chairs, we provide way more for party rentals.',
  hours: '9:00 am to 5:00 pm',
  email: 'Leapsoflaughterllc@gmail.com',
  whatsapp: 'https://wa.me/18135858354',
  // The exact Facebook page URL was not supplied. This opens a Facebook search
  // for the business name. Replace with the real page URL when known.
  facebook: 'https://www.facebook.com/search/pages/?q=Leaps%20of%20Laughter%20LLC',
  facebookLine: '100% recommend · 81 reviews on Facebook',
};

export const contacts = [
  { name: 'Heriberto Roldan', area: 'Hillsborough / Polk County', phone: '(813) 585-8354', tel: '+18135858354' },
  { name: 'Isaul Ceballos', area: 'Hernando / Pasco County', phone: '(352) 584-6865', tel: '+13525846865' },
];

export const serviceAreas = [
  'Plant City', 'Lakeland', 'Brandon', 'Spring Hill', 'Wesley Chapel',
  'Lutz', 'Brooksville', 'Weeki Wachee', 'Valrico', 'Tampa',
];

export type Category = 'bounce' | 'games' | 'addons';

export const categories: { id: Category; label: string }[] = [
  { id: 'bounce', label: 'Bounce & Water' },
  { id: 'games', label: 'Games' },
  { id: 'addons', label: 'Add-ons' },
];

export interface Rental {
  id: string;
  name: string;
  price: number;
  category: Category;
  art: string;
  /** Size lines exactly as supplied (capitalization tidied). */
  specs: string[];
  /** Short description as supplied (capitalization tidied). */
  note?: string;
}

export const rentals: Rental[] = [
  {
    id: 'purple-plunge', name: 'Purple Plunge', price: 270, category: 'bounce', art: 'plunge',
    specs: ['15 ft tall', '28 ft long', '16 ft wide'], note: 'Single lane water slide',
  },
  {
    id: 'twinkle-unicorn-combo', name: 'Twinkle Unicorn Combo', price: 250, category: 'bounce', art: 'unicorn',
    specs: [], note: 'Water unit',
  },
  {
    id: 'toxic-splash', name: 'Toxic Splash', price: 260, category: 'bounce', art: 'toxic',
    specs: ['16 ft tall', '11 ft wide'], note: 'Toxic radioactive slide',
  },
  {
    id: 'tropical-plunge', name: 'Tropical Plunge', price: 300, category: 'bounce', art: 'tropical',
    specs: ['17 ft tall', '35 ft long', '18 ft wide'], note: 'Two slides',
  },
  {
    id: 'santas-jump-house', name: "Santa's Jump House", price: 200, category: 'bounce', art: 'santa',
    specs: [], note: 'Holiday unit with a basketball hoop',
  },
  {
    id: 'life-size-jenga', name: 'Life-Size Jenga', price: 15, category: 'games', art: 'jenga',
    specs: [],
  },
  {
    id: 'cotton-candy-machine', name: 'Cotton Candy Machine', price: 60, category: 'addons', art: 'cotton',
    specs: [], note: 'Comes fully stocked',
  },
  {
    id: 'generator', name: 'Generator', price: 60, category: 'addons', art: 'generator',
    specs: [], note: 'Gas powered, for areas without power',
  },
  {
    id: 'water-hose', name: '50 ft Water Hose', price: 10, category: 'addons', art: 'hose',
    specs: [],
  },
];

// ---------------------------------------------------------------------------
// LAUNCH FLAG. The demo must never compete with the real site, so it is
// noindex. At launch set `indexable: true`: this removes the robots meta tag
// and flips robots.txt to allow crawling. Nothing else needs to change.
// ---------------------------------------------------------------------------
export const seo = { indexable: false };

export const sampleNote = 'Sample availability. In the live version this shows your real bookings.';
export const estimateNote = 'Estimate for rentals only, final details confirmed by Leaps of Laughter.';

// "Often added" row: shown when one of the trigger units is in the request.
export const oftenAdded = {
  triggers: ['purple-plunge', 'twinkle-unicorn-combo', 'toxic-splash', 'tropical-plunge'],
  items: ['generator', 'water-hose', 'cotton-candy-machine'],
};

// LocalBusiness structured data: only facts supplied by the business.
export function localBusinessJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: business.name,
    description: business.tagline,
    address: {
      '@type': 'PostalAddress',
      streetAddress: '603 Spruce Street',
      addressLocality: 'Plant City',
      addressRegion: 'FL',
      postalCode: '33563',
      addressCountry: 'US',
    },
    telephone: contacts.map((c) => c.tel),
    email: business.email,
    // Hours were supplied without days, so no dayOfWeek is stated.
    openingHoursSpecification: [{ '@type': 'OpeningHoursSpecification', opens: '09:00', closes: '17:00' }],
    areaServed: serviceAreas.map((name) => ({ '@type': 'City', name })),
  };
}
