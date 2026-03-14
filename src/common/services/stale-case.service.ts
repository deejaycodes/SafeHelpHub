import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Report } from 'src/common/entities/report.entity';
import { EventsGateway } from 'src/common/gateways/events.gateway';

@Injectable()
export class StaleCaseService {
  private readonly logger = new Logger(StaleCaseService.name);

  constructor(
    @InjectRepository(Report) private reportsRepo: Repository<Report>,
    private readonly eventsGateway: EventsGateway,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async flagStaleCases() {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const staleCases = await this.reportsRepo.find({
      where: [
        { status: 'submitted' as any, updated_at: LessThan(threeDaysAgo) },
        { status: 'under_review' as any, updated_at: LessThan(sevenDaysAgo) },
      ],
    });

    if (staleCases.length === 0) return;

    this.logger.warn({ event: 'stale_cases.detected', count: staleCases.length, ids: staleCases.map(r => r.id) }, `${staleCases.length} stale cases detected`);

    // Notify all NGOs assigned to stale cases
    const ngoIds = new Set<string>();
    staleCases.forEach(r => r.ngo_dashboard_ids?.forEach(id => ngoIds.add(id)));
    if (ngoIds.size > 0) {
      this.eventsGateway.notifyNgos(Array.from(ngoIds), 'cases:stale');
    }
  }
}
