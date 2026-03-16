import sharp from "sharp"

await sharp("assets/raw/og/og-image.jpg")
  .resize(1200, 630)
  .jpeg({ quality: 80 })
  .toFile("public/og-image.jpg")

console.log("✅ OG optimized")