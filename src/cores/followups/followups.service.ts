import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { FollowUp } from 'src/common/entities/followup.entity';
import { Report } from 'src/common/entities/report.entity';

@Injectable()
export class FollowUpsService {
  constructor(
    @InjectRepository(FollowUp)
    private followUpsRepository: Repository<FollowUp>,
    @InjectRepository(Report)
    private reportsRepository: Repository<Report>,
  ) {}

  async create(data: Partial<FollowUp>): Promise<FollowUp> {
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
      throw new ForbiddenException('You are not authorized to schedule follow-ups for this report');
    }

    const followUp = this.followUpsRepository.create(data);
    return await this.followUpsRepository.save(followUp);
  }

  async findUpcoming(ngoId: string): Promise<FollowUp[]> {
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    return await this.followUpsRepository.find({
      where: {
        ngoId,
        status: 'pending',
        scheduledDate: LessThanOrEqual(nextWeek),
      },
      order: { scheduledDate: 'ASC' },
      relations: ['report'],
    });
  }

  async findByReport(reportId: string): Promise<FollowUp[]> {
    return await this.followUpsRepository.find({
      where: { reportId },
      order: { scheduledDate: 'DESC' },
    });
  }

  async complete(id: string, outcome: string, ngoId: string): Promise<FollowUp> {
    const followUp = await this.followUpsRepository.findOne({ 
      where: { id },
      relations: ['report'],
    });

    if (!followUp) {
      throw new NotFoundException('Follow-up not found');
    }

    // Security: Only the NGO that created the follow-up can complete it
    if (followUp.ngoId !== ngoId) {
      throw new ForbiddenException('You are not authorized to complete this follow-up');
    }

    followUp.status = 'completed';
    followUp.completedAt = new Date();
    followUp.outcome = outcome;
    return await this.followUpsRepository.save(followUp);
  }
}
