import { Controller, Post, Get, Body, Param, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CaseNotesService } from './case-notes.service';

@ApiTags('Case Notes')
@Controller('reports/:reportId/notes')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth('jwt')
export class CaseNotesController {
  constructor(private readonly caseNotesService: CaseNotesService) {}

  @Post()
  @ApiOperation({ summary: 'Add a case note' })
  async addNote(
    @Param('reportId') reportId: string,
    @Body() noteDto: { content: string; type: 'internal' | 'victim_update' },
    @Req() req,
  ) {
    return this.caseNotesService.create({
      reportId,
      ngoId: req.user.id,
      staffMember: req.user.ngo_name || req.user.email,
      content: noteDto.content,
      type: noteDto.type,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Get all notes for a report' })
  async getNotes(@Param('reportId') reportId: string) {
    return this.caseNotesService.findByReport(reportId);
  }
}
