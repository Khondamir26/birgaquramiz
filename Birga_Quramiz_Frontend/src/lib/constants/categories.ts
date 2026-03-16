export const CATEGORY_IMAGES: Record<string, string> = {
  "BRK": "/images/categories/brick.avif", // Brick
  "CEM": "/images/categories/cement.avif", // Cement
  "ELC": "/images/categories/electrical.avif", // Electric
  "GEN": "/images/categories/building_materials.avif", // General
  "MTL": "/images/categories/metal.avif", // Metal
  "PNT": "/images/categories/paint.avif", // Paint
  "PIP": "/images/categories/plumbing.avif", // Pipe
  "TIL": "/images/categories/tile.avif", // Tile
  "TOL": "/images/categories/tools.avif", // Tool
  "WOD": "/images/categories/wood.avif", // Wood
  "all": "/images/categories/tools.avif",
};

export const getCategoryImage = (code: string) => {
  return CATEGORY_IMAGES[code] || undefined;
};
