/** Shared catalog for host applications and salon service editing */

export const SERVICE_CATEGORIES = [
  'manicure',
  'pedicure',
  'gel_manicure',
  'gel_pedicure',
  'acrylic',
  'nail_art',
  'dip_powder',
  'spa_pedicure',
  'combo',
  'hair_cut',
  'hair_styling',
  'hair_color',
  'hair_treatment',
  'hair_braiding',
  'hair_weaving',
  'hair_extensions',
  'wig_install',
  'wig_maintenance',
  'wig_custom',
  'lace_front_install',
  'closure_install',
  'braiding',
  'cornrows',
  'twists',
  'loc_maintenance',
  'other',
];

export const SERVICE_GROUPS = [
  {
    id: 'manicures',
    label: 'Manicures',
    items: [
      { catalogId: 'classic_manicure', name: 'Classic Manicure', category: 'manicure', defaultDuration: 45, defaultPrice: 3500 },
      { catalogId: 'gel_manicure', name: 'Gel Manicure', category: 'gel_manicure', defaultDuration: 60, defaultPrice: 5500 },
      { catalogId: 'dip_manicure', name: 'Dip Powder Manicure', category: 'dip_powder', defaultDuration: 60, defaultPrice: 6000 },
      { catalogId: 'acrylic_full_set', name: 'Acrylic Full Set', category: 'acrylic', defaultDuration: 90, defaultPrice: 8500 },
      { catalogId: 'acrylic_fill', name: 'Acrylic Fill', category: 'acrylic', defaultDuration: 75, defaultPrice: 6500 },
      { catalogId: 'nail_art', name: 'Nail Art (per set)', category: 'nail_art', defaultDuration: 30, defaultPrice: 2500 },
      { catalogId: 'mani_pedi_combo', name: 'Mani + Pedi Combo', category: 'combo', defaultDuration: 105, defaultPrice: 9000 },
    ],
  },
  {
    id: 'pedicures',
    label: 'Pedicures',
    items: [
      { catalogId: 'classic_pedicure', name: 'Classic Pedicure', category: 'pedicure', defaultDuration: 60, defaultPrice: 4500 },
      { catalogId: 'gel_pedicure', name: 'Gel Pedicure', category: 'gel_pedicure', defaultDuration: 75, defaultPrice: 6000 },
      { catalogId: 'spa_pedicure', name: 'Spa Pedicure', category: 'spa_pedicure', defaultDuration: 90, defaultPrice: 7500 },
    ],
  },
  {
    id: 'nail_other',
    label: 'Other nail services',
    items: [
      { catalogId: 'nail_removal', name: 'Nail Removal', category: 'other', defaultDuration: 30, defaultPrice: 2000 },
      { catalogId: 'nail_repair', name: 'Nail Repair (per nail)', category: 'other', defaultDuration: 15, defaultPrice: 1500 },
    ],
  },
  {
    id: 'hair',
    label: 'Hair services',
    items: [
      { catalogId: 'hair_cut', name: 'Haircut', category: 'hair_cut', defaultDuration: 45, defaultPrice: 4000 },
      { catalogId: 'hair_styling', name: 'Hair Styling', category: 'hair_styling', defaultDuration: 60, defaultPrice: 5000 },
      { catalogId: 'hair_color', name: 'Hair Color', category: 'hair_color', defaultDuration: 120, defaultPrice: 12000 },
      { catalogId: 'hair_treatment', name: 'Hair Treatment', category: 'hair_treatment', defaultDuration: 60, defaultPrice: 6500 },
      { catalogId: 'hair_weaving', name: 'Hair Weaving', category: 'hair_weaving', defaultDuration: 180, defaultPrice: 25000 },
      { catalogId: 'hair_extensions', name: 'Hair Extensions', category: 'hair_extensions', defaultDuration: 150, defaultPrice: 22000 },
    ],
  },
  {
    id: 'wigs_braids',
    label: 'Wigs, braids & installs',
    items: [
      { catalogId: 'wig_install', name: 'Wig Installation', category: 'wig_install', defaultDuration: 120, defaultPrice: 15000 },
      { catalogId: 'lace_front_install', name: 'Lace Front Install', category: 'lace_front_install', defaultDuration: 150, defaultPrice: 20000 },
      { catalogId: 'closure_install', name: 'Closure Install', category: 'closure_install', defaultDuration: 120, defaultPrice: 18000 },
      { catalogId: 'wig_maintenance', name: 'Wig Maintenance', category: 'wig_maintenance', defaultDuration: 60, defaultPrice: 8000 },
      { catalogId: 'wig_custom', name: 'Custom Wig', category: 'wig_custom', defaultDuration: 180, defaultPrice: 35000 },
      { catalogId: 'braiding', name: 'Braiding', category: 'braiding', defaultDuration: 180, defaultPrice: 18000 },
      { catalogId: 'cornrows', name: 'Cornrows', category: 'cornrows', defaultDuration: 120, defaultPrice: 12000 },
      { catalogId: 'twists', name: 'Twists', category: 'twists', defaultDuration: 150, defaultPrice: 15000 },
      { catalogId: 'loc_maintenance', name: 'Loc Maintenance', category: 'loc_maintenance', defaultDuration: 90, defaultPrice: 10000 },
      { catalogId: 'hair_braiding', name: 'Hair Braiding (general)', category: 'hair_braiding', defaultDuration: 180, defaultPrice: 16000 },
    ],
  },
];

export const ALL_CATALOG_ITEMS = SERVICE_GROUPS.flatMap((g) => g.items);

export const getCatalogItem = (catalogId) => ALL_CATALOG_ITEMS.find((i) => i.catalogId === catalogId);

export const formatCategoryLabel = (category) =>
  (category || 'other').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
