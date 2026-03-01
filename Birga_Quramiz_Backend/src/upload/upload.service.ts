import { Injectable, InternalServerErrorException } from '@nestjs/common'

@Injectable()
export class UploadService {
    /**
     * Multer's diskStorage already saved the file to disk.
     * This method just returns the public URL path served by NestJS static middleware.
     */
    uploadProductImage(file: Express.Multer.File): string {
        if (!file) {
            throw new InternalServerErrorException('No file provided for upload')
        }

        // file.filename is set by multer diskStorage
        return `/uploads/products/${file.filename}`
    }
}
