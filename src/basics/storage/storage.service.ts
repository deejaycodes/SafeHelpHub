import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Multer } from 'multer';

@Injectable()
export class StorageService {
  private supabase: SupabaseClient;
  private readonly logger = new Logger(StorageService.name);
  private readonly bucketName = 'reports';

  constructor(private readonly configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      this.logger.warn('Supabase not configured. File upload functionality will be limited.');
    } else {
      this.supabase = createClient(supabaseUrl, supabaseKey);
      this.logger.log('Supabase storage service initialized');
      this.initializeBucket();
    }
  }

  private async initializeBucket() {
    try {
      const { data: buckets } = await this.supabase.storage.listBuckets();
      const bucketExists = buckets?.some(b => b.name === this.bucketName);

      if (!bucketExists) {
        await this.supabase.storage.createBucket(this.bucketName, {
          public: false,
          fileSizeLimit: 10485760, // 10MB
        });
        this.logger.log(`Created storage bucket: ${this.bucketName}`);
      }
    } catch (error) {
      this.logger.error(`Failed to initialize bucket: ${error.message}`);
    }
  }

  async uploadFile(
    file: any,
    folder: string = 'uploads',
  ): Promise<string> {
    if (!this.supabase) {
      throw new Error('Supabase storage not configured');
    }

    const fileName = `${folder}/${Date.now()}-${file.originalname}`;

    const { data, error } = await this.supabase.storage
      .from(this.bucketName)
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      this.logger.error(`File upload failed: ${error.message}`);
      throw new Error(`File upload failed: ${error.message}`);
    }

    const { data: urlData } = this.supabase.storage
      .from(this.bucketName)
      .getPublicUrl(data.path);

    this.logger.log(`File uploaded: ${fileName}`);
    return urlData.publicUrl;
  }

  async deleteFile(filePath: string): Promise<void> {
    if (!this.supabase) {
      throw new Error('Supabase storage not configured');
    }

    const { error } = await this.supabase.storage
      .from(this.bucketName)
      .remove([filePath]);

    if (error) {
      this.logger.error(`File deletion failed: ${error.message}`);
      throw new Error(`File deletion failed: ${error.message}`);
    }

    this.logger.log(`File deleted: ${filePath}`);
  }

  async getSignedUrl(filePath: string, expiresIn: number = 3600): Promise<string> {
    if (!this.supabase) {
      throw new Error('Supabase storage not configured');
    }

    const { data, error } = await this.supabase.storage
      .from(this.bucketName)
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      this.logger.error(`Failed to generate signed URL: ${error.message}`);
      throw new Error(`Failed to generate signed URL: ${error.message}`);
    }

    return data.signedUrl;
  }
}
