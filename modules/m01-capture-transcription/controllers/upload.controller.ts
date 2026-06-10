import {
  Controller, Post, Req, UseGuards, BadRequestException,
  UseInterceptors, UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { extname, basename } from 'path';
import { TenantGuard } from '../../platform-core/guards/tenant.guard';
import { CallService } from '../services/call.service';
import { getUploadAudioDir, getPublicAudioUrl } from '../services/upload-paths';
import * as multer from 'multer';

const UPLOAD_DIR = getUploadAudioDir();

const audioStorage = multer.diskStorage({
  destination: (_req: any, _file: any, cb: any) => cb(null, UPLOAD_DIR),
  filename: (_req: any, file: any, cb: any) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = extname(file.originalname) || '.mp3';
    cb(null, `call-${uniqueSuffix}${ext}`);
  },
});

const ALLOWED_AUDIO = [
  'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav',
  'audio/ogg', 'audio/webm', 'audio/mp4', 'audio/m4a', 'audio/x-m4a',
  'audio/flac', 'audio/aac',
];

@Controller('api/v1/capture-transcription/calls')
@UseGuards(TenantGuard)
export class UploadController {
  constructor(private readonly svc: CallService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('audio', { storage: audioStorage, limits: { fileSize: 500 * 1024 * 1024 } }))
  async uploadAudio(
    @UploadedFile() file: any,
    @Req() req: any,
  ) {
    if (!file) throw new BadRequestException('No audio file provided');
    if (!ALLOWED_AUDIO.includes(file.mimetype)) {
      throw new BadRequestException(
        `Unsupported audio format: ${file.mimetype}. Accepted: MP3, WAV, OGG, M4A, FLAC, AAC`,
      );
    }

    // Auto-generate title from filename (strip extension)
    const rawName = basename(file.originalname, extname(file.originalname));
    const title = rawName
      .replace(/[-_]+/g, ' ')
      .replace(/\b\w/g, (c: string) => c.toUpperCase())
      .trim() || 'Uploaded Call';

    const audioUrl = getPublicAudioUrl(file.filename);

    return this.svc.createCallFromUpload(
      {
        title,
        audioUrl,
        originalFilename: file.originalname,
        fileSizeBytes: file.size,
        mimeType: file.mimetype,
      },
      req.tenantId,
    );
  }
}
