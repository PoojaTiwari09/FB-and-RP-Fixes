import {
  BadRequestException,
  Controller,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { extname, basename } from 'path';
import * as multer from 'multer';
import { TenantGuard } from '../../platform-core/guards/tenant.guard';
import { CallService } from '../services/call.service';
import { getUploadAudioDir, getPublicAudioUrl } from '../services/upload-paths';
import { MalwareScannerService } from '../services/malware-scanner.service';
import * as fs from 'fs';

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
  'audio/ogg', 'audio/webm', 'audio/mp4', 'audio/m4a',
];

/** Bridge: POST /api/calls/upload → same flow as legacy upload. */
@Controller('api/v1/capture-transcription/calls')
@UseGuards(TenantGuard)
export class M01FrontendUploadController {
  constructor(
    private readonly svc: CallService,
    private readonly scanner: MalwareScannerService,
  ) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('audio', { storage: audioStorage, limits: { fileSize: 500 * 1024 * 1024 } }),
  )
  async upload(
    @UploadedFile() file: any,
    @Req() req: Record<string, string>,
  ) {
    if (!file) throw new BadRequestException('No audio file provided');
    if (!ALLOWED_AUDIO.includes(file.mimetype)) {
      throw new BadRequestException(`Unsupported audio format: ${file.mimetype}`);
    }

    // Malware scanning check
    const isClean = await this.scanner.scanFile(file.path);
    if (!isClean) {
      try {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      } catch (err) {}
      throw new BadRequestException('Malware detected in uploaded file');
    }

    const rawName = basename(file.originalname, extname(file.originalname));
    const title =
      rawName.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()).trim() ||
      'Uploaded Call';

    const call = await this.svc.createCallFromUpload(
      {
        title,
        audioUrl: getPublicAudioUrl(file.filename),
        originalFilename: file.originalname,
        fileSizeBytes: file.size,
        mimeType: file.mimetype,
      },
      req.tenantId,
    );

    return {
      callId: call.id,
      status: 'processing',
      message: 'Upload received. Transcription queued.',
    };
  }
}
