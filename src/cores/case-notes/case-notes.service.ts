import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CaseNote } from 'src/common/entities/case-note.entity';

@Injectable()
export class CaseNotesService {
  constructor(
    @InjectRepository(CaseNote)
    private caseNotesRepository: Repository<CaseNote>,
  ) {}

  async create(data: Partial<CaseNote>): Promise<CaseNote> {
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
