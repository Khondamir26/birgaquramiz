/**
 * Multilingual search expansion utility for construction materials.
 * Maps common terms between RU, EN, and UZ to ensure products are found
 * regardless of the language they were listed in.
 */

const SEARCH_MAPPINGS: Record<string, string[]> = {
  // Building Materials
  "cement": ["цемент", "sement", "sementi"],
  "цемент": ["cement", "sement", "sementi"],
  "sement": ["cement", "цемент", "sementi"],

  "brick": ["кирпич", "g'isht", "gisht"],
  "кирпич": ["brick", "g'isht", "gisht"],
  "g'isht": ["brick", "кирпич", "gisht"],

  "concrete": ["бетон", "beton"],
  "бетон": ["concrete", "beton"],
  "beton": ["concrete", "бетон"],

  "rebar": ["арматура", "armatura"],
  "арматура": ["rebar", "armatura"],
  "armatura": ["rebar", "арматура"],

  "sand": ["песок", "qum"],
  "песок": ["sand", "qum"],
  "qum": ["sand", "песок"],

  "gravel": ["гравий", "щебень", "shag'al", "shagal"],
  "гравий": ["gravel", "shag'al", "shagal"],
  "щебень": ["gravel", "shag'al", "shagal"],
  "shag'al": ["gravel", "гравий", "shagal"],

  // Tools & Hardware
  "hammer": ["молоток", "bolg'a", "bolga"],
  "молоток": ["hammer", "bolg'a", "bolga"],
  "bolg'a": ["hammer", "молоток", "bolga"],

  "drill": ["дрель", "perforator", "drel"],
  "дрель": ["drill", "perforator", "drel"],
  "drel": ["drill", "дрель", "perforator"],

  "nails": ["гвозди", "miv", "mix"],
  "гвозди": ["nails", "mix"],
  "mix": ["nails", "гвозди"],

  "screws": ["шурупы", "samorez", "shurup"],
  "шурупы": ["screws", "shurup", "samorez"],
  "shurup": ["screws", "шурупы", "samorez"],

  // Finishes
  "paint": ["краска", "bo'yoq", "boyoq"],
  "краска": ["paint", "bo'yoq", "boyoq"],
  "bo'yoq": ["paint", "краска", "boyoq"],

  "varnish": ["лак", "lak"],
  "лак": ["varnish", "lak"],
  "lak": ["varnish", "лак"],

  "tile": ["плитка", "cherepitsa", "kafel"],
  "плитка": ["tile", "kafel"],
  "kafel": ["tile", "плитка"],

  "laminate": ["ламинат", "laminat"],
  "ламинат": ["laminate", "laminat"],
  "laminat": ["laminate", "ламинат"],

  "drywall": ["гипсокартон", "gipsokarton"],
  "гипсокартон": ["drywall", "gipsokarton"],
  "gipsokarton": ["drywall", "гипсокартон"],

  // Electrical
  "cable": ["кабель", "provod", "sim"],
  "кабель": ["cable", "sim", "provod"],
  "sim": ["cable", "кабель", "provod"],
};

const CYRILLIC_TO_LATIN: Record<string, string> = {
  'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'j', 'з': 'z',
  'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r',
  'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'x', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sh',
  'ы': 'y', 'э': 'e', 'ю': 'yu', 'я': 'ya', 'ь': '', 'ъ': ''
};

const LATIN_TO_CYRILLIC: Record<string, string> = Object.entries(CYRILLIC_TO_LATIN).reduce(
  (acc, [cyr, lat]) => ({ ...acc, [lat]: cyr }),
  {} as Record<string, string>
);

function transliterate(text: string, toLatin: boolean): string {
  const map = toLatin ? CYRILLIC_TO_LATIN : LATIN_TO_CYRILLIC;
  // Handle multi-char mappings like 'sh', 'ch', etc.
  let result = text;
  if (!toLatin) {
    // Longer latin sequences first
    const sequences = ['sh', 'ch', 'yo', 'yu', 'ya', 'ts'];
    sequences.forEach(seq => {
      const cyr = Object.keys(CYRILLIC_TO_LATIN).find(k => CYRILLIC_TO_LATIN[k] === seq);
      if (cyr) result = result.replace(new RegExp(seq, 'g'), cyr);
    });
  }
  
  return result.split('').map(char => map[char] || char).join('');
}

/**
 * Expands a search query with related terms in other languages.
 * Supports partial matching and universal transliteration for any word.
 */
export function expandSearchQuery(query: string): string {
  if (!query) return "";
  
  const normalized = query.trim().toLowerCase();
  if (normalized.length < 2) return normalized;

  const relatedTerms = new Set<string>();
  relatedTerms.add(normalized);

  // 1. Universal Transliteration (Works for ANY product name)
  const isCyrillic = /[а-яё]/.test(normalized);
  relatedTerms.add(transliterate(normalized, true)); // RU -> EN/UZ
  relatedTerms.add(transliterate(normalized, false)); // EN/UZ -> RU

  // 2. Dictionary-based expansion for non-transliterated synonyms
  Object.entries(SEARCH_MAPPINGS).forEach(([key, synonyms]) => {
    if (key.includes(normalized) || normalized.includes(key)) {
      relatedTerms.add(key);
      synonyms.forEach(s => relatedTerms.add(s));
    }
  });
  
  return Array.from(relatedTerms).join(" ");
}
