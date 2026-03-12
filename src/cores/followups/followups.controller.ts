import { Controller, Post, Get, Patch, Body, Param, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { FollowUpsService } from './followups.service';

@ApiTags('Follow-Ups')
@Controller('followups')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth('jwt')
export class FollowUpsController {
  constructor(private readonly followUpsService: FollowUpsService) {}

  @Post('reports/:reportId/followups')
  @ApiOperation({ summary: 'Schedule a follow-up' })
  async scheduleFollowUp(
    @Param('reportId') reportId: string,
    @Body() followUpDto: { scheduledDate: Date; notes: string },
    @Req() req,
  ) {
    return this.followUpsService.create({
      reportId,
      ngoId: req.user.id,
      scheduledDate: followUpDto.scheduledDate,
      notes: followUpDto.notes,
      status: 'pending',
    });
  }

  @Get('followups/upcoming')
  @ApiOperation({ summary: 'Get upcoming follow-ups for NGO' })
  async getUpcoming(@Req() req) {
    return this.followUpsService.findUpcoming(req.user.id);
  }

  @Get('reports/:reportId/followups')
  @ApiOperation({ summary: 'Get all follow-ups for a report' })
  async getByReport(@Param('reportId') reportId: string) {
    return this.followUpsService.findByReport(reportId);
  }

  @Patch('followups/:id/complete')
  @ApiOperation({ summary: 'Mark follow-up as completed' })
  async completeFollowUp(
    @Param('id') id: string,
    @Body() completeDto: { outcome: string },
  ) {
    return this.followUpsService.complete(id, completeDto.outcome);
  }
}
