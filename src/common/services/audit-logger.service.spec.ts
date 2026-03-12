import { Test, TestingModule } from '@nestjs/testing';
import { AuditLoggerService } from './audit-logger.service';

describe('AuditLoggerService', () => {
  let service: AuditLoggerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuditLoggerService],
    }).compile();

    service = module.get<AuditLoggerService>(AuditLoggerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should log report submitted event', () => {
    const logSpy = jest.spyOn(service['logger'], 'log');
    
    service.logReportSubmitted({
      reportId: '123',
      description: 'Test report',
      incidentType: 'sexual_abuse',
      location: 'Lagos',
    });

    expect(logSpy).toHaveBeenCalled();
  });

  it('should log urgent report event', () => {
    const warnSpy = jest.spyOn(service['logger'], 'warn');
    
    service.logUrgentReport({
      reportId: '123',
      urgency: 'critical',
      classification: 'Sexual Abuse',
      location: 'Lagos',
    });

    expect(warnSpy).toHaveBeenCalled();
  });
});
