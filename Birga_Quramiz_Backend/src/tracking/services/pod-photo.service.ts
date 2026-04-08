import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { AssignmentStatus, Role } from '@prisma/client'
import type { AuthUser } from '../../auth/auth.types'
import * as path from 'path'
import * as fs from 'fs'
import { randomUUID } from 'crypto'
import sharp from 'sharp'

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

/** Raw upload limit — Multer enforces this before any processing */
const MAX_RAW_FILE_SIZE_BYTES = 10 * 1024 * 1024   // 10 MB

/** Output limit — checked after Sharp compression */
const MAX_OUTPUT_SIZE_BYTES = 2 * 1024 * 1024       // 2 MB

const MAX_WIDTH_PX = 1024
const JPEG_QUALITY = 80
const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads', 'pod')

export interface PodGps {
  lat: number
  lng: number
}

@Injectable()
export class PodPhotoService {
  constructor(private readonly prisma: PrismaService) {
    // Ensure upload dir exists on startup
    fs.mkdirSync(UPLOAD_DIR, { recursive: true })
  }

  /** Called by Multer fileFilter — rejects before any bytes hit memory */
  static validateMime(mimetype: string): boolean {
    return ALLOWED_MIME_TYPES.has(mimetype)
  }

  static get maxFileSizeBytes() {
    return MAX_RAW_FILE_SIZE_BYTES
  }

  /**
   * Process an uploaded buffer through Sharp then write to disk:
   *  1. Re-validate MIME (belt-and-suspenders)
   *  2. Authorise caller
   *  3. Status gate
   *  4. Sharp: auto-orient → resize 1024px → JPEG 80% → strip EXIF → toBuffer()
   *  5. Validate output size ≤ 2 MB
   *  6. Write buffer to disk with UUID filename (collision-safe, unguessable)
   *  7. Persist URL + server timestamp + optional GPS to DB
   *
   * Returns the public URL path.
   */
  async savePodPhoto(
    assignmentId: string,
    fileBuffer: Buffer,
    mimetype: string,
    user: AuthUser,
    gps?: PodGps,
  ): Promise<string> {
    // ── 1. MIME re-validation ────────────────────────────────────────────────
    if (!ALLOWED_MIME_TYPES.has(mimetype)) {
      throw new BadRequestException(
        `Unsupported file type "${mimetype}". Allowed: image/jpeg, image/png, image/webp`,
      )
    }

    // ── 2. Authorise ─────────────────────────────────────────────────────────
    const assignment = await this.prisma.deliveryAssignment.findUnique({
      where: { id: assignmentId },
    })
    if (!assignment) throw new NotFoundException('Assignment not found')

    const isAssignedDriver = user.id === assignment.driverId
    const isPrivileged = user.role === Role.DISPATCHER || user.role === Role.ADMIN

    if (!isAssignedDriver && !isPrivileged) {
      throw new ForbiddenException('Not authorized to upload proof for this assignment')
    }

    // ── 3. Status gate ───────────────────────────────────────────────────────
    if (
      assignment.status === AssignmentStatus.PENDING ||
      assignment.status === AssignmentStatus.CANCELLED
    ) {
      throw new BadRequestException(
        `Cannot upload proof when assignment is ${assignment.status}`,
      )
    }

    // ── 4. Compress + resize via Sharp → toBuffer() ──────────────────────────
    // toBuffer() keeps processed bytes in memory so we can size-check before
    // committing to disk. No EXIF because withMetadata() is not called.
    const processedBuffer = await sharp(fileBuffer)
      .rotate()                                     // auto-orient from EXIF
      .resize({ width: MAX_WIDTH_PX, withoutEnlargement: true })
      .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
      .toBuffer()

    // ── 5. Output size guard ─────────────────────────────────────────────────
    if (processedBuffer.length > MAX_OUTPUT_SIZE_BYTES) {
      throw new BadRequestException(
        `Processed image is ${(processedBuffer.length / 1024 / 1024).toFixed(1)} MB — ` +
        `maximum allowed is ${MAX_OUTPUT_SIZE_BYTES / 1024 / 1024} MB. ` +
        `Try a lower-resolution photo.`,
      )
    }

    // ── 6. Write to disk with UUID filename ───────────────────────────────────
    // randomUUID(): collision-safe + harder to enumerate than timestamps
    const filename = `${randomUUID()}.jpg`
    const filePath = path.join(UPLOAD_DIR, filename)
    fs.writeFileSync(filePath, processedBuffer)

    // ── 7. Persist to DB ──────────────────────────────────────────────────────
    const publicUrl = `/uploads/pod/${filename}`
    const uploadedAt = new Date()   // server time — immune to device clock skew

    await this.prisma.deliveryAssignment.update({
      where: { id: assignmentId },
      data: {
        podPhotoUrl: publicUrl,
        podPhotoAt: uploadedAt,
        // GPS stored only if driver provided coordinates
        ...(gps != null && { podPhotoLat: gps.lat, podPhotoLng: gps.lng }),
      },
    })

    return publicUrl
  }
}
