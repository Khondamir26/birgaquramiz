import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
    private supabase: SupabaseClient;

    constructor() {
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_KEY;

        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Supabase credentials are not defined in environment variables');
        }

        this.supabase = createClient(supabaseUrl, supabaseKey);
    }

    async uploadProductImage(file: Express.Multer.File): Promise<string> {
        if (!file) {
            throw new InternalServerErrorException('No file provided for upload');
        }

        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const extension = file.originalname.split('.').pop();
        const filename = `${uniqueSuffix}.${extension}`;

        const { data, error } = await this.supabase.storage
            .from('products')
            .upload(filename, file.buffer, {
                contentType: file.mimetype,
                upsert: false,
            });

        if (error) {
            console.error('Supabase upload error:', error);
            throw new InternalServerErrorException('Failed to upload image to Supabase');
        }

        const { data: publicUrlData } = this.supabase.storage
            .from('products')
            .getPublicUrl(filename);

        return publicUrlData.publicUrl;
    }
}
