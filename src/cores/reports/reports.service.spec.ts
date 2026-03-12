import { Test, TestingModule } from '@nestjs/testing';
import { ReportsService } from './reports.service';
import { ReportsRepository } from './reports.repository';
import { UsersRepository } from 'src/basics/users/users.repository';
import { AIAnalysisService } from 'src/basics/ai/ai-analysis.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BadRequestException } from '@nestjs/common';
import { ReportStatus } from 'src/common/enums/report-status.enum';

describe('ReportsService', () => {
  let service: ReportsService;
  let reportsRepository: ReportsRepository;
  let aiAnalysisService: AIAnalysisService;
  let eventEmitter: EventEmitter2;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        {
          provide: ReportsRepository,
          useValue: {
            createIncident: jest.fn(),
            fetchSingleReportById: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: UsersRepository,
          useValue: {},
        },
        {
          provide: AIAnalysisService,
          useValue: {
            validateReport: jest.fn(),
          },
        },
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
    reportsRepository = module.get<ReportsRepository>(ReportsRepository);
    aiAnalysisService = module.get<AIAnalysisService>(AIAnalysisService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createIncidentWithFile', () => {
    it('should reject spam reports', async () => {
      jest.spyOn(aiAnalysisService, 'validateReport').mockResolvedValue({
        isValid: false,
        status: 'SPAM',
        reason: 'Spam detected',
        confidence: 0.95,
      });

      const createDto = {
        incident_type: 'other',
        description: 'test test test',
        location: 'Lagos',
        contact_preference: 'none',
      };

      await expect(
        service.createIncidentWithFile(createDto, [], null)
      ).rejects.toThrow(BadRequestException);
    });

    it('should create report and emit event for valid reports', async () => {
      const mockReport = {
        id: '123',
        incident_type: 'sexual_abuse',
        description: 'Valid detailed report',
        status: ReportStatus.SUBMITTED,
      };

      jest.spyOn(aiAnalysisService, 'validateReport').mockResolvedValue({
        isValid: true,
        status: 'VALID',
        reason: 'Report is valid',
        confidence: 0.9,
      });

      jest.spyOn(reportsRepository, 'createIncident').mockResolvedValue(mockReport as any);

      const createDto = {
        incident_type: 'sexual_abuse',
        description: 'This is a valid detailed report about an incident',
        location: 'Lagos',
        contact_preference: 'email',
      };

      const result = await service.createIncidentWithFile(createDto, [], null);

      expect(result).toBeDefined();
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'report.submitted',
        expect.objectContaining({
          reportId: mockReport.id,
        })
      );
    });
  });
});
