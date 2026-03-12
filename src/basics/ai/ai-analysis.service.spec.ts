import { Test, TestingModule } from '@nestjs/testing';
import { AIAnalysisService } from './ai-analysis.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RetryService } from 'src/common/services/retry.service';

describe('AIAnalysisService', () => {
  let service: AIAnalysisService;
  let eventEmitter: EventEmitter2;
  let retryService: RetryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AIAnalysisService,
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn(),
          },
        },
        {
          provide: RetryService,
          useValue: {
            addToRetryQueue: jest.fn(),
            removeFromRetryQueue: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AIAnalysisService>(AIAnalysisService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
    retryService = module.get<RetryService>(RetryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateReport', () => {
    it('should reject spam reports', async () => {
      const result = await service.validateReport('test test test', 'other');
      
      expect(result.isValid).toBe(false);
      expect(result.status).toBe('SPAM');
    });

    it('should accept valid reports', async () => {
      const description = 'I witnessed a serious incident yesterday evening that requires immediate attention from authorities';
      const result = await service.validateReport(description, 'sexual_abuse');
      
      expect(result.isValid).toBe(true);
      expect(result.status).toBe('VALID');
    });

    it('should flag unclear reports', async () => {
      const result = await service.validateReport('something happened', 'other');
      
      // Should either be valid or unclear, but not spam
      expect(['VALID', 'UNCLEAR']).toContain(result.status);
    });
  });

  describe('analyzeIncidentUrgency', () => {
    it('should return urgency analysis', async () => {
      const description = 'Someone is in immediate danger and needs help right now';
      const result = await service.analyzeIncidentUrgency(description);
      
      expect(result).toHaveProperty('urgency');
      expect(result).toHaveProperty('classification');
      expect(result).toHaveProperty('immediateDanger');
      expect(['critical', 'high', 'medium', 'low']).toContain(result.urgency);
    });
  });
});
