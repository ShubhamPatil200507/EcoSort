/**
 * Helper to convert internal snake_case waste subtypes into clean,
 * human-friendly titles with proper capitalization and acronym preservation.
 */
export const SUBTYPE_DISPLAY_MAP: Record<string, string> = {
  // Batteries
  alkaline_aa_aaa: 'Standard Alkaline (AA / AAA / 9V)',
  lithium_ion: 'Lithium-Ion Battery (Rechargeable)',
  lithium_ion_battery: 'Lithium-Ion Battery (Rechargeable)',
  button_cell: 'Button / Coin Cell (CR2032 / Watch)',
  button_cell_watch_battery: 'Button / Coin Cell (Watch & Toy)',
  lead_acid: 'Lead-Acid Heavy Battery',
  damaged_swollen_battery: 'Swollen / Damaged Battery (Hazardous)',

  // E-Waste
  smartphone_mobile: 'Smartphone / Mobile Device',
  mobile_phone: 'Smartphone / Mobile Device',
  laptop_computer: 'Laptop / Personal Computer',
  charger_cable: 'Charging Cable / Adapter',
  circuit_board: 'Printed Circuit Board (PCB)',
  printed_circuit_board: 'Printed Circuit Board (PCB)',
  computer_peripheral: 'Computer Peripheral (Mouse / Keyboard)',
  home_appliance: 'Small Home Appliance',

  // Plastics
  plastic_bottle: 'Plastic Bottle (PET #1 / HDPE #2)',
  food_container: 'Plastic Food Container / Tub',
  plastic_container: 'Rigid Plastic Container',
  plastic_packaging: 'Plastic Packaging Film / Wrap',
  plastic_wrapper: 'Plastic Film / Wrapper',
  plastic_bag: 'Plastic Carry Bag',
  disposable_cutlery: 'Disposable Plastic Cutlery',
  resin_pet: 'PET #1 Resin (Clear Bottle)',
  resin_hdpe: 'HDPE #2 Resin (Milk Jug / Detergent)',
  resin_pp: 'PP #5 Resin (Yogurt Tub / Straw)',

  // Paper & Cardboard
  cardboard_box: 'Corrugated Cardboard Box',
  corrugated_box: 'Corrugated Cardboard Box',
  newspaper_magazine: 'Newspaper & Magazine',
  newspaper: 'Newspaper',
  office_paper: 'Office & Document Paper',
  magazine: 'Glossy Magazine / Brochure',
  carton_packaging: 'Beverage Carton (Tetra Pak)',
  carton: 'Beverage Carton / Cardboard Carton',

  // Glass
  glass_bottle: 'Glass Beverage Bottle',
  glass_jar: 'Glass Food Jar',
  broken_glassware: 'Broken Glass Fragments',
  broken_glass: 'Broken Glass Fragments',
  cookware_glass: 'Cookware / Heat-Resistant Glass',

  // Metal
  aluminum_can: 'Aluminum Beverage Can',
  tin_can: 'Tin / Steel Food Can',
  metal_lid_foil: 'Metal Lid / Aluminum Foil',
  foil: 'Aluminum Foil / Pie Pan',
  scrap_metal: 'Mixed Scrap Metal',
  aerosol_can: 'Aerosol Spray Can',

  // Organic Food
  fruit_vegetable_peel: 'Fruit & Vegetable Scraps',
  fruit_vegetable_scraps: 'Fruit & Vegetable Scraps',
  food_leftovers: 'Cooked Food Leftovers',
  cooked_food: 'Cooked Food Leftovers',
  coffee_grounds_tea: 'Coffee Grounds & Tea Leaves',
  coffee_grounds: 'Coffee Grounds & Tea Leaves',
  dairy_meat: 'Meat, Dairy & Bones',
  garden_waste: 'Garden Leaves & Trimmings',
  garden_trimmings: 'Garden Leaves & Trimmings',

  // Hazardous
  paint_chemical_can: 'Paint / Chemical Solvent Can',
  paint_solvent: 'Paint / Chemical Solvent Can',
  cleaning_solvent: 'Household Cleaning Chemical Bottle',
  chemical_cleaner: 'Household Cleaning Chemical Bottle',
  motor_oil: 'Motor Oil / Automotive Fluid',
  pesticide_bottle: 'Pesticide / Herbicide Bottle',
  mercury_thermometer: 'Mercury Thermometer / Fluorescent Lamp',

  // Textiles
  garment_clothing: 'Wearable Clothing / Garment',
  clothing_garment: 'Wearable Clothing / Garment',
  shoes_footwear: 'Shoes & Footwear',
  fabric_scraps: 'Torn Fabric / Textile Scraps',
  torn_fabric: 'Torn Fabric / Textile Scraps',
  home_linen: 'Bedding, Towel & Linen',

  // General Residual
  sanitary_waste: 'Sanitary / Hygiene Waste',
  diaper_sanitary: 'Diaper & Sanitary Hygiene Waste',
  mixed_composites: 'Multi-Material Composite Packaging',
  composite_packaging: 'Multi-Material Composite Packaging',
  non_recyclable_wrapper: 'Metallized Plastic Foil Wrapper',
  cigarette_butts: 'Cigarette Butts & Filter Waste',
  ceramic_broken: 'Broken Ceramic / Porcelain Plate',
};

export function formatSubtype(subtype?: string): string {
  if (!subtype) return '';
  const key = subtype.toLowerCase().trim();
  if (SUBTYPE_DISPLAY_MAP[key]) {
    return SUBTYPE_DISPLAY_MAP[key];
  }
  return subtype
    .replace(/_/g, ' ')
    .replace(/\b([a-z])/g, (_, c) => c.toUpperCase())
    .replace(/\bAa\b/g, 'AA')
    .replace(/\bAaa\b/g, 'AAA')
    .replace(/\bPet\b/g, 'PET')
    .replace(/\bHdpe\b/g, 'HDPE')
    .replace(/\bPp\b/g, 'PP')
    .replace(/\bPcb\b/g, 'PCB');
}
