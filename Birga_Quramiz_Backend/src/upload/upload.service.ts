import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common'
import { readFileSync, writeFileSync, unlinkSync } from 'fs'
import { join, dirname } from 'path'
import sharp from 'sharp'

@Injectable()
export class UploadService {
    private readonly logger = new Logger(UploadService.name)

    /**
     * Saves the uploaded file and, if REMOVE_BG_API_KEY is configured,
     * calls the remove.bg API to strip the background, then uses sharp to
     * auto-trim transparent margins and add equal padding so every product
     * fills its frame consistently regardless of original image dimensions.
     *
     * Falls back to the original file if the API call or processing fails.
     */
    async uploadProductImage(file: Express.Multer.File): Promise<string> {
        if (!file) {
            throw new InternalServerErrorException('No file provided for upload')
        }

        const apiKey = process.env.REMOVE_BG_API_KEY
        if (!apiKey) {
            return `/uploads/products/${file.filename}`
        }

        try {
            const fileBuffer = readFileSync(file.path)
            const base64 = fileBuffer.toString('base64')

            // ── Step 1: remove background via remove.bg ──
            const response = await fetch('https://api.remove.bg/v1.0/removebg', {
                method: 'POST',
                headers: {
                    'X-Api-Key': apiKey,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    image_file_b64: base64,
                    size: 'auto',
                    format: 'png',
                }),
            })

            if (!response.ok) {
                const errText = await response.text().catch(() => response.statusText)
                this.logger.warn(`remove.bg API error ${response.status}: ${errText} — using original image`)
                return `/uploads/products/${file.filename}`
            }

            const removedBgBuffer = Buffer.from(await response.arrayBuffer())

            // ── Step 2: trim transparent margins ──
            const trimmedBuffer = await sharp(removedBgBuffer)
                .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 10 })
                .png()
                .toBuffer()

            // ── Step 3: add proportional padding (5% of the larger dimension) ──
            // Fixed pixel padding looks inconsistent across different image sizes,
            // so we calculate padding relative to the trimmed product dimensions.
            const { width = 800, height = 800 } = await sharp(trimmedBuffer).metadata()
            const pad = Math.round(Math.max(width, height) * 0.05)

            const processedBuffer = await sharp(trimmedBuffer)
                .extend({
                    top: pad,
                    bottom: pad,
                    left: pad,
                    right: pad,
                    background: { r: 0, g: 0, b: 0, alpha: 0 },
                })
                .png()
                .toBuffer()

            // ── Step 3: save processed PNG ──
            const newFilename = file.filename.replace(/\.[^.]+$/, '.png')
            const newPath = join(dirname(file.path), newFilename)
            writeFileSync(newPath, processedBuffer)

            if (newFilename !== file.filename) {
                unlinkSync(file.path)
            }

            return `/uploads/products/${newFilename}`
        } catch (err) {
            this.logger.warn(`Background removal failed: ${(err as Error).message} — using original image`)
            return `/uploads/products/${file.filename}`
        }
    }
}
