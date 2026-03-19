import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly isDev: boolean;
  private readonly uploadsDir: string;

  constructor(private config: ConfigService) {
    this.isDev = this.config.get('NODE_ENV') !== 'production';
    this.uploadsDir = path.join(process.cwd(), 'uploads');

    if (this.isDev && !fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  async uploadFile(file: Express.Multer.File): Promise<string> {
    if (this.isDev) {
      return this.uploadLocal(file);
    }
    return this.uploadCloudinary(file);
  }

  private async uploadLocal(file: Express.Multer.File): Promise<string> {
    const filename = `${Date.now()}-${file.originalname}`;
    const filepath = path.join(this.uploadsDir, filename);
    fs.writeFileSync(filepath, file.buffer);
    return `/uploads/${filename}`;
  }

  private async uploadCloudinary(file: Express.Multer.File): Promise<string> {
    // Dynamic require to avoid type issues — cloudinary is only needed in production
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const cloudinary = require('cloudinary').v2;

    cloudinary.config({
      cloud_name: this.config.getOrThrow('CLOUDINARY_CLOUD_NAME'),
      api_key: this.config.getOrThrow('CLOUDINARY_API_KEY'),
      api_secret: this.config.getOrThrow('CLOUDINARY_API_SECRET'),
    });

    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          { folder: 'gameball-ecommerce' },
          (error: any, result: any) => {
            if (error) return reject(error);
            resolve(result.secure_url);
          },
        )
        .end(file.buffer);
    });
  }
}
