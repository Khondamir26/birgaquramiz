import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common'
import { unlinkSync } from 'fs'
import { readFileSync } from 'fs'
import { extname } from 'path'
import sharp from 'sharp'
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'

@Injectable()
export class UploadService {
    private readonly logger = new Logger(UploadService.name)

    private readonly s3 = new S3Client({
        region: 'auto',
        endpoint: process.env.R2_ENDPOINT,
        credentials: {
            accessKeyId: process.env.R2_ACCESS_KEY_ID ?? '',
            secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? '',
        },
    })

    private readonly bucket = process.env.R2_BUCKET ?? 'birga-media'
    private readonly publicUrl = (process.env.R2_PUBLIC_URL ?? '').replace(/\/$/, '')

    /**
     * Uploads the product image to Cloudflare R2.
     * If REMOVE_BG_API_KEY is set, removes the background first and converts to WebP.
     * Falls back to the original file on any processing error.
     */
    async uploadProductImage(file: Express.Multer.File): Promise<string> {
        if (!file) {
            throw new InternalServerErrorException('No file provided for upload')
        }

        const apiKey = process.env.REMOVE_BG_API_KEY
        let buffer: Buffer
        let filename: string

        try {
            if (!apiKey) {
                buffer = readFileSync(file.path)
                filename = file.filename
            } else {
                const result = await this.processWithRemoveBg(file)
                buffer = result.buffer
                filename = result.filename
            }

            // Upload to R2
            const key = `products/${filename}`
            await this.s3.send(new PutObjectCommand({
                Bucket: this.bucket,
                Key: key,
                Body: buffer,
                ContentType: filename.endsWith('.webp') ? 'image/webp' : file.mimetype,
                CacheControl: 'public, max-age=31536000, immutable',
            }))

            return `${this.publicUrl}/${key}`
        } catch (err) {
            this.logger.error(`Upload failed: ${(err as Error).message}`)
            throw new InternalServerErrorException('Image upload failed')
        } finally {
            // Clean up temp file
            try { unlinkSync(file.path) } catch { /* ignore */ }
        }
    }

    private async processWithRemoveBg(file: Express.Multer.File): Promise<{ buffer: Buffer; filename: string }> {
        try {
            const fileBuffer = readFileSync(file.path)
            const base64 = fileBuffer.toString('base64')

            // ── Step 1: remove background via remove.bg ──
            const response = await fetch('https://api.remove.bg/v1.0/removebg', {
                method: 'POST',
                headers: {
                    'X-Api-Key': process.env.REMOVE_BG_API_KEY!,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    image_file_b64: base64,
                    size: 'auto',
                    format: 'png',
                }),
                signal: AbortSignal.timeout(30_000),
            })

            if (!response.ok) {
                const errText = await response.text().catch(() => response.statusText)
                this.logger.warn(`remove.bg API error ${response.status}: ${errText} — using original image`)
                return { buffer: fileBuffer, filename: file.filename }
            }

            const removedBgBuffer = Buffer.from(await response.arrayBuffer())

            // ── Step 2: trim transparent margins ──
            const trimmedBuffer = await sharp(removedBgBuffer)
                .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 10 })
                .webp({ quality: 85 })
                .toBuffer()

            // ── Step 3: add proportional padding (5% of the larger dimension) ──
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
                .webp({ quality: 85 })
                .toBuffer()

            const filename = file.filename.replace(/\.[^.]+$/, '.webp')
            return { buffer: processedBuffer, filename }
        } catch (err) {
            this.logger.warn(`Background removal failed: ${(err as Error).message} — using original image`)
            return { buffer: readFileSync(file.path), filename: file.filename }
        }
    }

    async uploadBuffer(key: string, buffer: Buffer, contentType: string): Promise<string> {
        await this.s3.send(new PutObjectCommand({
            Bucket: this.bucket,
            Key: key,
            Body: buffer,
            ContentType: contentType,
            CacheControl: 'public, max-age=31536000, immutable',
        }))
        return `${this.publicUrl}/${key}`
    }

    async deleteProductImage(url: string): Promise<void> {
        try {
            const key = url.replace(`${this.publicUrl}/`, '')
            await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }))
        } catch (err) {
            this.logger.warn(`Failed to delete image from R2: ${(err as Error).message}`)
        }
    }
}
