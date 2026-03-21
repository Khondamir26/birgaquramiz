/**
 * Seed EN + UZ translations for all categories.
 * Run with: npx ts-node prisma/seed-category-translations.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// code → { en, uz }
const TRANSLATIONS: Record<string, { en: string; uz: string }> = {
  // ── Parent categories ──────────────────────────────────────────────────────
  MIX: { en: 'Building Mixes', uz: 'Qurilish aralashmalari' },
  ROF: { en: 'Roofing', uz: 'Tom qoplama' },
  INS: { en: 'Insulation', uz: 'Izolyatsiya' },
  DRW: { en: 'Drywall & Profiles', uz: 'Gipsokarton va profillar' },
  PNT: { en: 'Paints & Varnishes', uz: "Bo'yoqlar va laklar" },
  MTL: { en: 'Metal Products', uz: 'Metall mahsulotlari' },
  FAS: { en: 'Fasteners', uz: 'Mahkamlagichlar' },
  TOL: { en: 'Tools', uz: 'Asboblar' },
  PLM: { en: 'Plumbing', uz: 'Santexnika' },
  ELC: { en: 'Electrical & Lighting', uz: 'Elektr va yoritish' },
  BLK: { en: 'Blocks & Bricks', uz: "Bloklar va g'isht" },
  FLR: { en: 'Flooring', uz: 'Pol qoplamalari' },
  WOD: { en: 'Wood Materials', uz: "Yog'och materiallar" },
  VNT: { en: 'Ventilation', uz: 'Ventilyatsiya' },
  DOR: { en: 'Doors & Windows', uz: 'Eshiklar va derazalar' },
  RPR: { en: 'Repair Supplies', uz: "Ta'mirlash materiallari" },
  MSH: { en: 'Mesh & Fiberglass', uz: "To'rlar va stekloxolst" },
  HTG: { en: 'Heating', uz: 'Isitish' },
  FPR: { en: 'Fire Protection', uz: "O't o'chirish" },
  PMP: { en: 'Water Pumps', uz: 'Suv nasoslari' },
  FIN: { en: 'Finishing', uz: 'Pardozlash' },
  MCH: { en: 'Machinery', uz: 'Mashina va uskunalar' },
  DRN: { en: 'Drainage', uz: 'Kanalizatsiya' },
  GEN: { en: 'General', uz: 'Umumiy' },

  // ── MIX subcategories ──────────────────────────────────────────────────────
  'MIX-CEM': { en: 'Cement, Alabaster, Gypsum', uz: 'Sement, alebaster, gips' },
  'MIX-PLT': { en: 'Plasters', uz: 'Shtukaturkalar' },
  'MIX-SPK': { en: 'Putties', uz: 'Shpatlyovkalar' },
  'MIX-ADH': { en: 'Adhesive Mixes', uz: 'Yelimli aralashmalar' },
  'MIX-FLR': { en: 'Floor Mixes', uz: 'Pol aralashmalari' },
  'MIX-GRT': { en: 'Grout', uz: 'Fugalar' },
  'MIX-ADD': { en: 'Mix Additives', uz: "Aralashma qo'shimchalari" },

  // ── ROF subcategories ──────────────────────────────────────────────────────
  'ROF-ROL': { en: 'Roll Roofing', uz: 'Rulon tom qoplama' },
  'ROF-BIT': { en: 'Bitumen & Mastic', uz: 'Bitum va mastika' },
  'ROF-MEM': {
    en: 'Waterproofing Membranes',
    uz: 'Gidroizolyatsiya membranalari',
  },
  'ROF-SHF': { en: 'Slate', uz: 'Shifer' },
  'ROF-ONL': { en: 'Onduline', uz: 'Ondulin' },
  'ROF-ACC': { en: 'Roofing Accessories', uz: 'Tom qoplama aksessuarlari' },

  // ── INS subcategories ──────────────────────────────────────────────────────
  'INS-MIN': { en: 'Mineral Wool', uz: 'Mineral vata' },
  'INS-GLS': { en: 'Glass Wool', uz: 'Shisha vata' },
  'INS-FOM': { en: 'Foam / Penoplex', uz: "Ko'pikplas / Penoplex" },
  'INS-FAC': { en: 'Facade Insulation', uz: 'Fasad izolyatsiyasi' },
  'INS-PIP': { en: 'Pipe Insulation', uz: 'Quvur izolyatsiyasi' },

  // ── DRW subcategories ──────────────────────────────────────────────────────
  'DRW-SHT': { en: 'Drywall Sheets', uz: 'Gipsokarton varaqlar' },
  'DRW-PRF': { en: 'Drywall Profiles', uz: 'Gipsokarton profillari' },
  'DRW-CON': { en: 'Hangers & Connectors', uz: 'Osuvchi va ulagichlar' },
  'DRW-TPE': { en: 'Mesh Tape', uz: 'Serpyanka va lentalar' },
  'DRW-CRN': { en: 'Corner Beads', uz: 'Burchak profillari' },
  'DRW-BCN': { en: 'Plaster Beacons', uz: 'Shtukaturka mayoqchalari' },

  // ── PNT subcategories ──────────────────────────────────────────────────────
  'PNT-PNT': { en: 'Paints', uz: "Bo'yoqlar" },
  'PNT-LAK': { en: 'Varnishes', uz: 'Laklar' },
  'PNT-EML': { en: 'Enamels', uz: 'Emallar' },
  'PNT-THN': { en: 'Thinners & Solvents', uz: 'Erituvchilar' },
  'PNT-PRM': { en: 'Primers', uz: 'Gruntovkalar' },

  // ── MTL subcategories ──────────────────────────────────────────────────────
  'MTL-ARR': { en: 'Rebar', uz: 'Armatura' },
  'MTL-ANG': { en: 'Metal Angle', uz: 'Metall burchak' },
  'MTL-PIP': { en: 'Steel Pipes', uz: "Po'lat quvurlar" },
  'MTL-WIR': { en: 'Wire & Rod', uz: 'Sim va katanka' },
  'MTL-MSH': { en: 'Metal Mesh', uz: "Metall to'r" },

  // ── FAS subcategories ──────────────────────────────────────────────────────
  'FAS-SCR': { en: 'Screws', uz: 'Vintlar va shurупlar' },
  'FAS-DYB': { en: 'Dowels', uz: 'Dyubellar' },
  'FAS-NAL': { en: 'Nails', uz: 'Mixlar' },
  'FAS-ANK': { en: 'Anchors', uz: 'Ankerlar' },
  'FAS-BLT': { en: 'Bolts, Nuts & Studs', uz: 'Boltlar, gaykalar, shpilkalar' },
  'FAS-PRF': {
    en: 'Perforated Brackets',
    uz: 'Perforatsiyalangan mahkamlagichlar',
  },
  'FAS-CLM': { en: 'Clamps & Ties', uz: 'Xomutlar va qisqichlar' },

  // ── TOL subcategories ──────────────────────────────────────────────────────
  'TOL-ELC': { en: 'Power Tools', uz: 'Elektr asboblar' },
  'TOL-HND': { en: 'Hand Tools', uz: "Qo'l asboblar" },
  'TOL-PNT': { en: 'Painting Tools', uz: "Bo'yoq asboblari" },
  'TOL-PLT': { en: 'Plastering Tools', uz: 'Shtukaturka asboblari' },
  'TOL-CUT': { en: 'Cutting & Sawing', uz: 'Kesish va arra asboblari' },
  'TOL-MSR': { en: 'Measuring Tools', uz: "O'lchash va belgilash" },
  'TOL-DRL': {
    en: 'Drills & Screwdrivers',
    uz: 'Perforator va shuruplagichlar',
  },
  'TOL-GRD': { en: 'Grinding & Polishing', uz: 'Silliqlash va pardozlash' },
  'TOL-WLD': { en: 'Welding Electrodes', uz: 'Payvandlash elektrodlari' },
  'TOL-EQP': { en: 'Construction Equipment', uz: 'Qurilish uskunalari' },
  'TOL-CMP': { en: 'Compressor Equipment', uz: 'Kompressor uskunalari' },
  'TOL-SCF': { en: 'Scaffolding', uz: 'Lesa va minoralar' },

  // ── PLM subcategories ──────────────────────────────────────────────────────
  'PLM-FAU': { en: 'Faucets & Accessories', uz: 'Kran va aksessuarlar' },
  'PLM-PVC': { en: 'PVC Sewer Pipes', uz: 'PVX kanalizatsiya quvurlari' },
  'PLM-WSH': { en: 'Water Supply & Heating', uz: "Suv ta'minoti va isitish" },
  'PLM-RAD': { en: 'Radiators', uz: 'Radiatorlar' },
  'PLM-HTR': { en: 'Water Heaters', uz: 'Suv isitgichlar' },
  'PLM-INS': { en: 'Pipe Insulation', uz: 'Quvur izolyatsiyasi' },
  'PLM-UFH': { en: 'Underfloor Heating', uz: 'Issiq pol' },
  'PLM-FLT': { en: 'Water Filtration', uz: 'Suv filtrlash tizimlari' },
  'PLM-BTH': { en: 'Baths & Showers', uz: 'Vanna va dush kabinalari' },
  'PLM-SAN': { en: 'Toilets & Sinks', uz: 'Unitaz va lavabolar' },

  // ── ELC subcategories ──────────────────────────────────────────────────────
  'ELC-CAB': { en: 'Cables & Wires', uz: 'Kabellar va simlar' },
  'ELC-SWT': { en: 'Sockets & Switches', uz: 'Rozetkalar va kalitlar' },
  'ELC-LMP': { en: 'Lamps & Fixtures', uz: 'Lampalar va chiroqlar' },
  'ELC-BRK': { en: 'Circuit Breakers', uz: 'Avtomatlar va щitlar' },
  'ELC-CDT': {
    en: 'Conduits & Cable Trays',
    uz: 'Gofrotrubalar va kabel kanallar',
  },
  'ELC-BOX': { en: 'Junction Boxes', uz: 'Montaj qutilar' },
  'ELC-STB': { en: 'Voltage Stabilizers', uz: 'Kuchlanish stabilizatorlari' },
  'ELC-COX': { en: 'Coaxial Cable (TV)', uz: 'Koaksial kabel (TV)' },
  'ELC-OUT': {
    en: 'Floodlights & Outdoor',
    uz: "Proektor va ko'cha chiroqlari",
  },

  // ── BLK subcategories ──────────────────────────────────────────────────────
  'BLK-BLK': { en: 'Building Blocks', uz: 'Qurilish bloklari' },
  'BLK-BRK': { en: 'Bricks', uz: "G'ishtlar" },
  'BLK-CEM': { en: 'Cement', uz: 'Sement' },
  'BLK-SND': { en: 'Sand & Gravel', uz: "Qum va shag'al" },

  // ── FLR subcategories ──────────────────────────────────────────────────────
  'FLR-LAM': { en: 'Laminate', uz: 'Laminat' },
  'FLR-LNL': { en: 'Linoleum', uz: 'Linoleum' },
  'FLR-TLE': { en: 'Floor Tiles', uz: 'Pol plitkalari' },
  'FLR-UND': { en: 'Underlay', uz: 'Podlojka' },

  // ── WOD subcategories ──────────────────────────────────────────────────────
  'WOD-PLY': { en: 'Plywood', uz: 'Fanera' },
  'WOD-OSB': { en: 'OSB Boards', uz: 'OSB plitalar' },
  'WOD-TMB': { en: 'Timber & Battens', uz: "Yog'och va reykalar" },
  'WOD-CLG': { en: 'Clapboard', uz: 'Vagonka' },

  // ── VNT subcategories ──────────────────────────────────────────────────────
  'VNT-FAN': { en: 'Fans', uz: 'Ventilyatorlar' },
  'VNT-DCT': { en: 'Ducts & Channels', uz: "Kanallar va havo o'tkazgichlar" },
  'VNT-GRL': { en: 'Grilles & Hatches', uz: 'Panjurlar va lyuklar' },
  'VNT-ACC': { en: 'Ventilation Parts', uz: 'Ventilyatsiya qismlari' },

  // ── DOR subcategories ──────────────────────────────────────────────────────
  'DOR-INT': { en: 'Interior Doors', uz: 'Ichki eshiklar' },
  'DOR-EXT': { en: 'Exterior Doors', uz: 'Kirish eshiklari' },
  'DOR-HRD': { en: 'Door Handles & Locks', uz: "Qo'l tutqichlari va qulflar" },
  'DOR-WIN': { en: 'Window Profiles', uz: 'Deraza profillari' },

  // ── RPR subcategories ──────────────────────────────────────────────────────
  'RPR-ADH': { en: 'Adhesives & Sealants', uz: 'Yelimlar va germetiklar' },
  'RPR-TPE': { en: 'Tapes & Masking', uz: 'Lentalar va skotch' },
  'RPR-TLE': { en: 'Tile Laying Supplies', uz: 'Plitkani yotqizish uchun' },
  'RPR-PPE': { en: 'Safety Equipment (PPE)', uz: 'Himoya vositalari (SIZ)' },
  'RPR-COV': { en: 'Protective Covers', uz: 'Qoplovchi materiallar' },
  'RPR-FOM': { en: 'Mounting Foam', uz: "Montaj ko'pigi" },

  // ── MSH subcategories ──────────────────────────────────────────────────────
  'MSH-LAY': { en: 'Masonry Mesh', uz: "Kладочная to'r" },
  'MSH-PLT': { en: 'Plaster Mesh', uz: "Shtukaturka to'ri" },
  'MSH-GLS': { en: 'Fiberglass Mesh', uz: "Shisha to'r" },
  'MSH-BSL': { en: 'Basalt Mesh', uz: "Bazalt to'r" },
  'MSH-ROD': { en: 'Road Mesh', uz: "Yo'l to'ri" },

  // ── HTG subcategories ──────────────────────────────────────────────────────
  'HTG-BLR': { en: 'Boilers', uz: 'Qozonlar' },
  'HTG-RAD': { en: 'Heating Radiators', uz: 'Isitish radiatorlari' },
  'HTG-PIP': { en: 'Heating Pipes', uz: 'Isitish quvurlari' },

  // ── FPR subcategories ──────────────────────────────────────────────────────
  'FPR-PNT': { en: 'Fire-Resistant Paints', uz: "O't o'chirish bo'yoqlari" },
  'FPR-IMP': {
    en: 'Fire-Resistant Impregnations',
    uz: "O't o'chirish gruntovkalari",
  },
  'FPR-SEL': { en: 'Fire-Stop Sealants', uz: "O't o'chirish germetiklari" },
  'FPR-BRD': { en: 'Fire-Resistant Boards', uz: "O't o'chirish plitalari" },

  // ── PMP subcategories ──────────────────────────────────────────────────────
  'PMP-SUB': { en: 'Submersible Pumps', uz: "O'tqazib yuboradigan nasoslar" },
  'PMP-SRF': { en: 'Surface Pumps', uz: 'Yuzaki nasoslar' },
  'PMP-CRC': { en: 'Circulation Pumps', uz: 'Sirkulyatsiya nasos' },
  'PMP-STA': { en: 'Pump Stations', uz: 'Nasos stansiyalari' },
  'PMP-DRN': { en: 'Drainage Pumps', uz: 'Drenaj nasosar' },

  // ── FIN subcategories ──────────────────────────────────────────────────────
  'FIN-TLE': { en: 'Facing Tiles', uz: 'Fasad plitkalari' },
  'FIN-PVC': { en: 'PVC Panels', uz: 'PVX panellar' },
  'FIN-MDF': { en: 'MDF Clapboard', uz: 'MDF vagonka' },
  'FIN-PLT': { en: 'Decorative Plaster', uz: 'Dekorativ shtukaturka' },
  'FIN-WLP': { en: 'Wallpaper', uz: "Devor qog'ozlari" },
  'FIN-CLG': { en: 'Stretch Ceilings', uz: "Cho'zilma shiftlar" },

  // ── MCH subcategories ──────────────────────────────────────────────────────
  'MCH-TLC': { en: 'Electric Tile Cutters', uz: 'Elektr plitka kesuvchilar' },
  'MCH-GRD': { en: 'Grinding Machines', uz: 'Silliqlash dastgohlari' },
  'MCH-WOD': { en: 'Woodworking Machines', uz: "Yog'och ishlash dastgohlari" },
  'MCH-MTL': { en: 'Metalworking Machines', uz: 'Metall ishlash dastgohlari' },
  'MCH-CMP': { en: 'Compressors', uz: 'Kompressorlar' },
  'MCH-MXR': { en: 'Concrete Mixers', uz: 'Beton aralashtiruvchilar' },

  // ── DRN subcategories ──────────────────────────────────────────────────────
  'DRN-PIP': { en: 'Sewer Pipes', uz: 'Kanalizatsiya quvurlari' },
  'DRN-FIT': { en: 'Fittings & Couplings', uz: 'Fitinglar va ulagichlar' },
  'DRN-ACC': { en: 'Inspection Hatches', uz: 'Taftish lyuklari' },
  'DRN-SYS': { en: 'Drainage Systems', uz: 'Drenaj tizimlari' },
  'DRN-SEP': { en: 'Septic Tanks', uz: 'Septiklar' },
};

async function main() {
  console.log('🌐 Seeding category translations...\n');

  let updated = 0;
  let notFound = 0;

  for (const [code, { en, uz }] of Object.entries(TRANSLATIONS)) {
    const result = await prisma.category.updateMany({
      where: { code },
      data: { nameEn: en, nameUz: uz },
    });

    if (result.count > 0) {
      console.log(`✅ ${code}`);
      updated++;
    } else {
      console.warn(`⚠️  ${code} not found`);
      notFound++;
    }
  }

  console.log(`\n✨ Done! ${updated} translated, ${notFound} not found.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
