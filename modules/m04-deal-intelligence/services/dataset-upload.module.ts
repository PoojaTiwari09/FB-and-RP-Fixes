import { Module } from '@nestjs/common';
import { DatasetUploadService } from './dataset-upload.service';
@Module({ providers: [DatasetUploadService], exports: [DatasetUploadService] })
export class DatasetUploadModule {}
