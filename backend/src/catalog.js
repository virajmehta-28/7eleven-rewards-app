// 7REWARDS redemption catalog. IDs mirror the loyalty platform's numeric reward SKUs.
// qualifyingSkus: in-store products a reward can be applied to at checkout (one unit per redemption).
export const REWARDS = [
  { id: 1042, name: 'Any Size Hot Coffee', category: 'Coffee', pointsCost: 400, image: 'cup.and.saucer.fill', qualifyingSkus: ['COF-7S-HOT-20'] },
  { id: 1043, name: 'Big Gulp (Any Size)', category: 'Drinks', pointsCost: 250, image: 'takeoutbag.and.cup.and.straw.fill', qualifyingSkus: ['BGP-FTN-30'] },
  { id: 1051, name: 'Slurpee (Any Size)', category: 'Drinks', pointsCost: 300, image: 'snowflake', qualifyingSkus: ['SLP-COKE-M'] },
  { id: 1067, name: 'Big Bite Hot Dog', category: 'Hot Foods', pointsCost: 500, image: 'flame.fill', qualifyingSkus: ['BBT-QTR-LB'] },
  { id: 1072, name: 'Large Pizza', category: 'Hot Foods', pointsCost: 1500, image: 'circle.grid.cross.fill', qualifyingSkus: ['PZA-PEP-LG'] },
  { id: 1088, name: 'Chips (Any Brand)', category: 'Snacks', pointsCost: 350, image: 'bag.fill', qualifyingSkus: ['CHP-DOR-NCH'] },
  { id: 1093, name: '7-Select Donut', category: 'Bakery', pointsCost: 200, image: 'circle.dashed', qualifyingSkus: ['BKY-7S-GLZ'] },
  { id: 1105, name: '$5 Off Fuel', category: 'Fuel', pointsCost: 1000, image: 'fuelpump.fill', qualifyingSkus: [] }
];

// 7NOW / in-store product catalog. Prices are authoritative for checkout (the client never sends prices).
export const PRODUCTS = [
  { sku: 'COF-7S-HOT-20', name: '7-Select Hot Coffee 20oz', category: 'Drinks', priceCents: 199 },
  { sku: 'SLP-COKE-M', name: 'Slurpee Coke Medium', category: 'Drinks', priceCents: 229 },
  { sku: 'BGP-FTN-30', name: 'Big Gulp 30oz', category: 'Drinks', priceCents: 179 },
  { sku: 'RBL-ENR-12', name: 'Red Bull 12oz', category: 'Drinks', priceCents: 399 },
  { sku: 'BBT-QTR-LB', name: 'Big Bite Quarter Pound', category: 'Hot Foods', priceCents: 349 },
  { sku: 'PZA-PEP-LG', name: 'Large Pepperoni Pizza', category: 'Hot Foods', priceCents: 999 },
  { sku: 'TAQ-CHK-2', name: 'Chicken Taquitos (2)', category: 'Hot Foods', priceCents: 299 },
  { sku: 'CHP-DOR-NCH', name: 'Doritos Nacho Cheese', category: 'Snacks', priceCents: 249 },
  { sku: 'BKY-7S-GLZ', name: '7-Select Glazed Donut', category: 'Snacks', priceCents: 139 },
  { sku: 'SNK-7S-TRL', name: '7-Select Trail Mix', category: 'Snacks', priceCents: 429 },
  { sku: 'OTC-ADV-24', name: 'Advil 24ct', category: 'Essentials', priceCents: 749 },
  { sku: 'ACC-USBC-CHG', name: 'Phone Charger USB-C', category: 'Essentials', priceCents: 1499 }
];

export const MEMBERS = new Map([
  ['7R-00418892', { id: '7R-00418892', firstName: 'Viraj', lastName: 'Mehta', tier: 'Gold', points: 2840, homeStore: 'Store #35187 · 1200 Main St, Dallas, TX', redemptions: [] }]
]);
