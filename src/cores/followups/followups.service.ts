import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { FollowUp } from 'src/common/entities/followup.entity';

@Injectable()
export class FollowUpsService {
  constructor(
    @InjectRepository(FollowUp)
    private followUpsRepository: Repository<FollowUp>,
  ) {}

  async create(data: Partial<FollowUp>): Promise<FollowUp> {
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

  async complete(id: string, outcome: string): Promise<FollowUp> {
    const followUp = await this.followUpsRepository.findOne({ where: { id } });
    followUp.status = 'completed';
    followUp.completedAt = new Date();
    followUp.outcome = outcome;
    return await this.followUpsRepository.save(followUp);
  }
}
