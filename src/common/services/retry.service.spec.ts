import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RetryService } from './retry.service';

describe('RetryService', () => {
  let service: RetryService;
  let eventEmitter: EventEmitter2;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RetryService,
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RetryService>(RetryService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should add task to retry queue', () => {
    service.addToRetryQueue('report-123', 'report.submitted', { reportId: 'report-123' });
    
    const status = service.getRetryQueueStatus();
    expect(status.queueSize).toBe(1);
    expect(status.tasks[0].reportId).toBe('report-123');
  });

  it('should remove task from retry queue', () => {
    service.addToRetryQueue('report-123', 'report.submitted', { reportId: 'report-123' });
    service.removeFromRetryQueue('report-123');
    
    const status = service.getRetryQueueStatus();
    expect(status.queueSize).toBe(0);
  });

  it('should not exceed max retry attempts', () => {
    const reportId = 'report-123';
    
    // Add 3 times (max attempts)
    service.addToRetryQueue(reportId, 'report.submitted', { reportId });
    service.addToRetryQueue(reportId, 'report.submitted', { reportId });
    service.addToRetryQueue(reportId, 'report.submitted', { reportId });
    
    // 4th attempt should not be added
    service.addToRetryQueue(reportId, 'report.submitted', { reportId });
    
    const status = service.getRetryQueueStatus();
    expect(status.tasks[0].attempts).toBeLessThanOrEqual(3);
  });
});
