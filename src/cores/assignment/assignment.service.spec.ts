import { Test, TestingModule } from '@nestjs/testing';
import { AssignmentService } from './assignment.service';
import { ReportsRepository } from '../reports/reports.repository';
import { UsersRepository } from 'src/basics/users/users.repository';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NOTIFICATION_EVENTS } from 'src/common/events/event-names';

describe('AssignmentService', () => {
  let service: AssignmentService;
  let reportsRepository: ReportsRepository;
  let usersRepository: UsersRepository;
  let eventEmitter: EventEmitter2;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssignmentService,
        {
          provide: ReportsRepository,
          useValue: {
            fetchSingleReportById: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: UsersRepository,
          useValue: {
            findAllNgos: jest.fn(),
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

    service = module.get<AssignmentService>(AssignmentService);
    reportsRepository = module.get<ReportsRepository>(ReportsRepository);
    usersRepository = module.get<UsersRepository>(UsersRepository);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('autoAssignReport', () => {
    it('should assign report to top 3 NGOs', async () => {
      const mockReport = {
        id: 'report-123',
        incident_type: 'sexual_abuse',
        location: 'Lagos',
        ngo_dashboard_ids: [],
      };

      const mockNgos = [
        {
          id: 'ngo-1',
          location: 'Lagos',
          specializations: ['sexual_abuse'],
          acceptReportsCount: 2,
          resolvedReportsCount: 2,
        },
        {
          id: 'ngo-2',
          location: 'Lagos',
          specializations: ['fgm'],
          acceptReportsCount: 5,
          resolvedReportsCount: 3,
        },
        {
          id: 'ngo-3',
          location: 'Abuja',
          specializations: ['sexual_abuse'],
          acceptReportsCount: 1,
          resolvedReportsCount: 1,
        },
        {
          id: 'ngo-4',
          location: 'Lagos',
          specializations: ['sexual_abuse'],
          acceptReportsCount: 15,
          resolvedReportsCount: 10,
        },
      ];

      jest.spyOn(reportsRepository, 'fetchSingleReportById').mockResolvedValue(mockReport as any);
      jest.spyOn(usersRepository, 'findAllNgos').mockResolvedValue(mockNgos as any);
      jest.spyOn(reportsRepository, 'save').mockResolvedValue(mockReport as any);

      await service.autoAssignReport({
        reportId: 'report-123',
        urgency: 'critical',
        classification: 'Sexual Abuse',
        immediateDanger: true,
      });

      // Should assign to 3 NGOs
      expect(reportsRepository.save).toHaveBeenCalled();
      const savedReport = (reportsRepository.save as jest.Mock).mock.calls[0][0];
      expect(savedReport.ngo_dashboard_ids).toHaveLength(3);
      expect(savedReport.ngo_dashboard_ids).toContain('ngo-1'); // Best match

      // Should emit 3 notifications
      expect(eventEmitter.emit).toHaveBeenCalledTimes(3);
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        NOTIFICATION_EVENTS.NGO_ALERT,
        expect.objectContaining({
          reportId: 'report-123',
          urgency: 'critical',
        })
      );
    });

    it('should handle no eligible NGOs', async () => {
      const mockReport = {
        id: 'report-123',
        incident_type: 'sexual_abuse',
        location: 'Lagos',
        ngo_dashboard_ids: [],
      };

      jest.spyOn(reportsRepository, 'fetchSingleReportById').mockResolvedValue(mockReport as any);
      jest.spyOn(usersRepository, 'findAllNgos').mockResolvedValue([]);

      await service.autoAssignReport({
        reportId: 'report-123',
        urgency: 'critical',
        classification: 'Sexual Abuse',
        immediateDanger: true,
      });

      // Should not save or emit
      expect(reportsRepository.save).not.toHaveBeenCalled();
      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });

    it('should handle report not found', async () => {
      jest.spyOn(reportsRepository, 'fetchSingleReportById').mockResolvedValue(null);

      await service.autoAssignReport({
        reportId: 'report-123',
        urgency: 'critical',
        classification: 'Sexual Abuse',
        immediateDanger: true,
      });

      // Should not proceed
      expect(usersRepository.findAllNgos).not.toHaveBeenCalled();
      expect(reportsRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('scoring algorithm', () => {
    it('should score location match highest', async () => {
      const mockReport = {
        id: 'report-123',
        incident_type: 'sexual_abuse',
        location: 'Lagos',
        ngo_dashboard_ids: [],
      };

      const mockNgos = [
        {
          id: 'ngo-lagos',
          location: 'Lagos',
          specializations: [],
          acceptReportsCount: 10,
          resolvedReportsCount: 5,
        },
        {
          id: 'ngo-abuja',
          location: 'Abuja',
          specializations: ['sexual_abuse'],
          acceptReportsCount: 2,
          resolvedReportsCount: 2,
        },
      ];

      jest.spyOn(reportsRepository, 'fetchSingleReportById').mockResolvedValue(mockReport as any);
      jest.spyOn(usersRepository, 'findAllNgos').mockResolvedValue(mockNgos as any);
      jest.spyOn(reportsRepository, 'save').mockResolvedValue(mockReport as any);

      await service.autoAssignReport({
        reportId: 'report-123',
        urgency: 'critical',
        classification: 'Sexual Abuse',
        immediateDanger: true,
      });

      // Lagos NGO should be first (location match worth 40 points)
      expect(reportsRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          ngo_dashboard_ids: expect.arrayContaining(['ngo-lagos']),
        })
      );
    });

    it('should prioritize low workload NGOs', async () => {
      const mockReport = {
        id: 'report-123',
        incident_type: 'sexual_abuse',
        location: 'Lagos',
        ngo_dashboard_ids: [],
      };

      const mockNgos = [
        {
          id: 'ngo-busy',
          location: 'Lagos',
          specializations: ['sexual_abuse'],
          acceptReportsCount: 20,
          resolvedReportsCount: 15,
        },
        {
          id: 'ngo-available',
          location: 'Lagos',
          specializations: ['sexual_abuse'],
          acceptReportsCount: 2,
          resolvedReportsCount: 2,
        },
      ];

      jest.spyOn(reportsRepository, 'fetchSingleReportById').mockResolvedValue(mockReport as any);
      jest.spyOn(usersRepository, 'findAllNgos').mockResolvedValue(mockNgos as any);
      jest.spyOn(reportsRepository, 'save').mockResolvedValue(mockReport as any);

      await service.autoAssignReport({
        reportId: 'report-123',
        urgency: 'critical',
        classification: 'Sexual Abuse',
        immediateDanger: true,
      });

      // Available NGO should be first
      const savedReport = (reportsRepository.save as jest.Mock).mock.calls[0][0];
      expect(savedReport.ngo_dashboard_ids[0]).toBe('ngo-available');
    });

    it('should consider specialization match', async () => {
      const mockReport = {
        id: 'report-123',
        incident_type: 'sexual_abuse',
        location: 'Lagos',
        ngo_dashboard_ids: [],
      };

      const mockNgos = [
        {
          id: 'ngo-specialist',
          location: 'Lagos',
          specializations: ['sexual_abuse'],
          acceptReportsCount: 5,
          resolvedReportsCount: 4,
        },
        {
          id: 'ngo-generalist',
          location: 'Lagos',
          specializations: ['fgm', 'child_abuse'],
          acceptReportsCount: 5,
          resolvedReportsCount: 4,
        },
      ];

      jest.spyOn(reportsRepository, 'fetchSingleReportById').mockResolvedValue(mockReport as any);
      jest.spyOn(usersRepository, 'findAllNgos').mockResolvedValue(mockNgos as any);
      jest.spyOn(reportsRepository, 'save').mockResolvedValue(mockReport as any);

      await service.autoAssignReport({
        reportId: 'report-123',
        urgency: 'critical',
        classification: 'Sexual Abuse',
        immediateDanger: true,
      });

      // Specialist should be first
      const savedReport = (reportsRepository.save as jest.Mock).mock.calls[0][0];
      expect(savedReport.ngo_dashboard_ids[0]).toBe('ngo-specialist');
    });
  });
});
