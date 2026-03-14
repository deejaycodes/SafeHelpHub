import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CaseNote } from 'src/common/entities/case-note.entity';
import { Report } from 'src/common/entities/report.entity';
import { EmailService } from 'src/basics/email/email.service';

@Injectable()
export class CaseNotesService {
  constructor(
    @InjectRepository(CaseNote)
    private caseNotesRepository: Repository<CaseNote>,
    @InjectRepository(Report)
    private reportsRepository: Repository<Report>,
    private readonly emailService: EmailService,
  ) {}

  async create(data: Partial<CaseNote>): Promise<CaseNote> {
    // Validate required fields
    if (!data.content || data.content.trim() === '') {
      throw new BadRequestException('Note content is required');
    }

    if (!data.reportId) {
      throw new BadRequestException('Report ID is required');
    }

    // Security: Verify NGO is assigned to this report
    const report = await this.reportsRepository.findOne({
      where: { id: data.reportId },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    // Check if NGO is assigned to this report
    const isAssigned = report.ngo_dashboard_ids?.includes(data.ngoId) || 
                       report.accepted_by?.includes(data.ngoId);

    if (!isAssigned) {
      throw new ForbiddenException('You are not authorized to add notes to this report');
    }

    const note = this.caseNotesRepository.create(data);
    const saved = await this.caseNotesRepository.save(note);

    // Notify reporter via email if caseworker replied and reporter left contact info
    if (data.type === 'caseworker_reply' && report.contact_info) {
      const email = report.contact_info;
      if (email.includes('@')) {
        this.emailService.sendReporterNotification(email, report.id).catch(() => {});
      }
    }

    return saved;
  }

  async findByReport(reportId: string): Promise<CaseNote[]> {
    return await this.caseNotesRepository.find({
      where: { reportId },
      order: { createdAt: 'DESC' },
    });
  }

  async findByNgo(ngoId: string): Promise<CaseNote[]> {
    return await this.caseNotesRepository.find({
      where: { ngoId },
      order: { createdAt: 'DESC' },
    });
  }
}
