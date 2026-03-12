import { Module } from '@nestjs/common';
import { AIAnalysisService } from './ai-analysis.service';
import { AIAnalysisClientService } from './ai-analysis-client.service';
import { ConfigModule } from '@nestjs/config';
import { RetryService } from 'src/common/services/retry.service';

@Module({
  imports: [ConfigModule],
  providers: [
    AIAnalysisService,
    AIAnalysisClientService,
    RetryService,
    {
      provide: 'AI_ANALYSIS',
      useFactory: (clientService: AIAnalysisClientService, originalService: AIAnalysisService) => {
        // Feature flag determines which service to use
        return process.env.USE_HYBRID_AI_SERVICE === 'true' ? clientService : originalService;
      },
      inject: [AIAnalysisClientService, AIAnalysisService],
    },
  ],
  exports: ['AI_ANALYSIS', AIAnalysisService, AIAnalysisClientService],
})
export class AIAnalysisModule {}
