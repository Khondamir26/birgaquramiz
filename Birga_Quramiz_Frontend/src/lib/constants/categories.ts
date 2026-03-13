export const CATEGORY_IMAGES: Record<string, string> = {
  "BRK": "/images/categories/brick.png", // Brick
  "CEM": "/images/categories/cement.png", // Cement
  "ELC": "/images/categories/electrical.png", // Electric
  "GEN": "/images/categories/building_materials.png", // General
  "MTL": "/images/categories/metal.png", // Metal
  "PNT": "/images/categories/paint.png", // Paint
  "PIP": "/images/categories/plumbing.png", // Pipe
  "TIL": "/images/categories/tile.png", // Tile
  "TOL": "/images/categories/tools.png", // Tool
  "WOD": "/images/categories/wood.png", // Wood
  "all": "/images/categories/tools.png",
};

export const getCategoryImage = (code: string) => {
  return CATEGORY_IMAGES[code] || undefined;
};
