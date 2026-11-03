// 7REWARDS redemption catalog. IDs mirror the loyalty platform's numeric reward SKUs.
export const REWARDS = [
  { id: 1042, name: 'Any Size Hot Coffee', category: 'Coffee', pointsCost: 400, image: 'cup.and.saucer.fill' },
  { id: 1043, name: 'Big Gulp (Any Size)', category: 'Drinks', pointsCost: 250, image: 'takeoutbag.and.cup.and.straw.fill' },
  { id: 1051, name: 'Slurpee (Any Size)', category: 'Drinks', pointsCost: 300, image: 'snowflake' },
  { id: 1067, name: 'Big Bite Hot Dog', category: 'Hot Foods', pointsCost: 500, image: 'flame.fill' },
  { id: 1072, name: 'Large Pizza', category: 'Hot Foods', pointsCost: 1500, image: 'circle.grid.cross.fill' },
  { id: 1088, name: 'Chips (Any Brand)', category: 'Snacks', pointsCost: 350, image: 'bag.fill' },
  { id: 1093, name: '7-Select Donut', category: 'Bakery', pointsCost: 200, image: 'circle.dashed' },
  { id: 1105, name: '$5 Off Fuel', category: 'Fuel', pointsCost: 1000, image: 'fuelpump.fill' }
];

export const MEMBERS = new Map([
  ['7R-00418892', { id: '7R-00418892', firstName: 'Viraj', lastName: 'Mehta', tier: 'Gold', points: 2840, homeStore: 'Store #35187 · 1200 Main St, Dallas, TX', redemptions: [] }]
]);
