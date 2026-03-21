/* eslint-disable @typescript-eslint/no-require-imports */

const sharp = require("sharp")
const fs = require("fs")
const path = require("path")

const ROOT = process.cwd()

const TASKS = [
  {
    name: "banners",
    input: path.join(ROOT, "assets/raw/banners"),
    output: path.join(ROOT, "public/images/banners"),
    width: 1440,
    height: 300,
    quality: 50,
  },
  {
    name: "categories",
    input: path.join(ROOT, "assets/raw/categories"),
    output: path.join(ROOT, "public/images/categories"),
    width: 300,
    height: 300,
    quality: 45,
  },
  {
    name: "logos",
    input: path.join(ROOT, "assets/raw/logos"),
    output: path.join(ROOT, "public/images/logos"),
    width: 300,
    height: 300,
    quality: 60,
  },
]

async function processTask(task) {
  console.log("📂 processing:", task.name)

  const files = await fs.promises.readdir(task.input)

  await fs.promises.mkdir(task.output, { recursive: true })

  for (const file of files) {
    if (!/\.(png|jpg|jpeg|webp)$/i.test(file)) continue

    const input = path.join(task.input, file)
    const output = path.join(
      task.output,
      file.replace(/\.(png|jpg|jpeg|webp)$/i, ".avif")
    )

    await sharp(input)
      .resize(task.width, task.height, {
        fit: "cover",
      })
      .avif({ quality: task.quality })
      .toFile(output)

    console.log("✓", output)
  }
}

async function run() {
  console.log("🚀 image optimization started")

  for (const task of TASKS) {
    await processTask(task)
  }

  console.log("✅ image optimization finished")
}

run()