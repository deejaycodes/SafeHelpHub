import { Controller, Post, Get, Body, Param, BadRequestException, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report } from 'src/common/entities/report.entity';
import { CaseNote } from 'src/common/entities/case-note.entity';
import { TrackingInstrumentation } from 'src/common/instrumentation';
import { Throttle } from '@nestjs/throttler';

@ApiTags('Public Tracking')
@Controller('track')
export class TrackingController {
  constructor(
    @InjectRepository(Report) private reportsRepo: Repository<Report>,
    @InjectRepository(CaseNote) private notesRepo: Repository<CaseNote>,
    private readonly instrumentation: TrackingInstrumentation,
  ) {}

  @Get(':reportId')
  @Throttle({ medium: { ttl: 60000, limit: 10 } })
  @ApiOperation({ summary: 'Get report status and messages by tracking ID (no auth)' })
  async getStatus(@Param('reportId') reportId: string) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isUuid = uuidRegex.test(reportId);
    const isTrackingCode = /^SV-[A-Z0-9]{6}$/i.test(reportId);
    if (!isUuid && !isTrackingCode) throw new NotFoundException('Report not found. Check your tracking ID.');

    const report = await this.reportsRepo.findOne({
      where: isUuid ? { id: reportId } : { tracking_code: reportId.toUpperCase() },
    });
    if (!report) {
      this.instrumentation.reportLookupNotFound(reportId);
      throw new NotFoundException('Report not found. Check your tracking ID.');
    }

    this.instrumentation.reportLookedUp(reportId);

    const messages = await this.notesRepo.find({
      where: [
        { reportId, type: 'reporter_message' },
        { reportId, type: 'caseworker_reply' },
      ],
      order: { createdAt: 'ASC' },
    });

    return {
      id: report.id,
      status: report.status,
      incident_type: report.incident_type,
      created_at: report.created_at,
      updated_at: report.updated_at,
      messages: messages.map(m => ({
        id: m.id,
        content: m.content,
        type: m.type,
        createdAt: m.createdAt,
      })),
    };
  }

  @Post(':reportId/messages')
  @Throttle({ medium: { ttl: 60000, limit: 5 } })
  @ApiOperation({ summary: 'Send a message on a report (no auth, anonymous)' })
  async sendMessage(
    @Param('reportId') reportId: string,
    @Body() body: { content: string },
  ) {
    if (!body.content?.trim()) throw new BadRequestException('Message cannot be empty');
    if (body.content.length > 2000) throw new BadRequestException('Message too long (max 2000 characters)');

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(reportId);
    const report = await this.reportsRepo.findOne({
      where: isUuid ? { id: reportId } : { tracking_code: reportId.toUpperCase() },
    });
    if (!report) throw new NotFoundException('Report not found');

    const note = this.notesRepo.create({
      reportId,
      ngoId: 'anonymous',
      staffMember: 'Reporter',
      content: body.content.trim(),
      type: 'reporter_message',
    });
    const saved = await this.notesRepo.save(note);
    this.instrumentation.reporterMessageSent(reportId);
    return saved;
  }
}
