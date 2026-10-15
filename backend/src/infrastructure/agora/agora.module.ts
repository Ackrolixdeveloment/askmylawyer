import { Global, Module } from '@nestjs/common';
import { AgoraService } from './agora.service';
import { AgoraSttService } from './agora-stt.service';
import { TranscriptService } from './transcript.service';

@Global()
@Module({
  providers: [AgoraService, AgoraSttService, TranscriptService],
  exports: [AgoraService, AgoraSttService, TranscriptService],
})
export class AgoraModule {}
