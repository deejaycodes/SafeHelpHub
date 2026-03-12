import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CaseNote } from 'src/common/entities/case-note.entity';
import { Report } from 'src/common/entities/report.entity';

@Injectable()
export class CaseNotesService {
  constructor(
    @InjectRepository(CaseNote)
    private caseNotesRepository: Repository<CaseNote>,
    @InjectRepository(Report)
    private reportsRepository: Repository<Report>,
  ) {}

  async create(data: Partial<CaseNote>): Promise<CaseNote> {
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
    return await this.caseNotesRepository.save(note);
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
