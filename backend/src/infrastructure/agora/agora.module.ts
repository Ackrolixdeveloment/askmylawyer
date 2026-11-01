import { AgoraRecordingService } from './agora-recording.service';
import { Global, Module } from '@nestjs/common';
import { AgoraService } from './agora.service';
import { AgoraSttService } from './agora-stt.service';
import { TranscriptService } from './transcript.service';

@Global()
@Module({
  providers: [AgoraService, AgoraSttService, TranscriptService, AgoraRecordingService],
  exports: [AgoraService, AgoraSttService, TranscriptService, AgoraRecordingService],
})
export class AgoraModule {}
