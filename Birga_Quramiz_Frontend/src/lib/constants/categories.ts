export const CATEGORY_IMAGES: Record<string, string> = {
  "MIX": "/images/categories/mix.avif",
  "ROF": "/images/categories/roofing.avif",
  "INS": "/images/categories/insulation.avif",
  "DRW": "/images/categories/drywall.avif",
  "PNT": "/images/categories/paint.avif",
  "MTL": "/images/categories/metal.avif",
  "FAS": "/images/categories/fasteners.avif",
  "TOL": "/images/categories/tools.avif",
  "PLM": "/images/categories/plumbing.avif",
  "ELC": "/images/categories/electrical.avif",
  "BLK": "/images/categories/brick.avif",
  "FLR": "/images/categories/tile.avif",
  "WOD": "/images/categories/wood.avif",
  "VNT": "/images/categories/ventilation.avif",
  "DOR": "/images/categories/doors.avif",
  "RPR": "/images/categories/repair.avif",
  "MSH": "/images/categories/mesh.avif",
  "HTG": "/images/categories/heating.avif",
  "FPR": "/images/categories/fire_protection.avif",
  "PMP": "/images/categories/pumps.avif",
  "FIN": "/images/categories/finishing.avif",
  "MCH": "/images/categories/machinery.avif",
  "DRN": "/images/categories/drainage.avif",
  "GEN": "/images/categories/building_materials.avif",
};

const CATEGORY_SHORT_NAMES: Record<string, { ru: string; uz: string; en: string }> = {
  "MIX": { ru: "Смеси",       uz: "Aralashmalar", en: "Mixes"      },
  "ROF": { ru: "Кровля",      uz: "Tom",          en: "Roofing"    },
  "INS": { ru: "Утеплители",  uz: "Izolyatsiya",  en: "Insulation" },
  "DRW": { ru: "Гипсокартон", uz: "Gipsokarton",  en: "Drywall"    },
  "PNT": { ru: "Краски",      uz: "Bo'yoqlar",    en: "Paints"     },
  "MTL": { ru: "Металл",      uz: "Metall",       en: "Metal"      },
  "FAS": { ru: "Крепёж",      uz: "Mahkamlagich", en: "Fasteners"  },
  "TOL": { ru: "Инструмент",  uz: "Asboblar",     en: "Tools"      },
  "PLM": { ru: "Сантехника",  uz: "Santexnika",   en: "Plumbing"   },
  "ELC": { ru: "Электрика",   uz: "Elektr",       en: "Electrical" },
  "BLK": { ru: "Кирпич",      uz: "G'isht",       en: "Bricks"     },
  "FLR": { ru: "Полы",        uz: "Pol",          en: "Flooring"   },
  "WOD": { ru: "Дерево",      uz: "Yog'och",      en: "Wood"       },
  "VNT": { ru: "Вентиляция",  uz: "Ventilyatsiya",en: "Ventilation"},
  "DOR": { ru: "Двери",       uz: "Eshiklar",     en: "Doors"      },
  "RPR": { ru: "Ремонт",      uz: "Ta'mirlash",   en: "Repair"     },
  "MSH": { ru: "Сетки",       uz: "To'rlar",      en: "Mesh"       },
  "HTG": { ru: "Отопление",   uz: "Isitish",      en: "Heating"    },
  "FPR": { ru: "Огнезащита",  uz: "Yong'inga",    en: "Fire Prot." },
  "PMP": { ru: "Насосы",      uz: "Nasoslar",     en: "Pumps"      },
  "FIN": { ru: "Отделка",     uz: "Pardozlash",   en: "Finishing"  },
  "MCH": { ru: "Станки",      uz: "Mashinalar",   en: "Machinery"  },
  "DRN": { ru: "Дренаж",      uz: "Drenaj",       en: "Drainage"   },
  "GEN": { ru: "Общее",       uz: "Umumiy",       en: "General"    },
};

const FALLBACK_IMAGE = "/images/categories/building_materials.avif";

export const getCategoryImage = (code: string): string =>
  CATEGORY_IMAGES[code] ?? FALLBACK_IMAGE;

export const getCategoryShortName = (code: string, locale: string, fallback: string): string => {
  const entry = CATEGORY_SHORT_NAMES[code];
  if (!entry) return fallback;
  if (locale === "uz") return entry.uz;
  if (locale === "en") return entry.en;
  return entry.ru;
};
