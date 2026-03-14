import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
  HttpStatus,
  Patch,
  Req,
  UploadedFiles,
  NotFoundException,
  InternalServerErrorException,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { CreateIncidentDto } from '../../common/dtos/reportsDto';
import { Report } from 'src/common/entities/report.entity';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from 'src/cores/authentication/strategy/jwt-guard';
import {  FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import * as _ from 'lodash';
import { User } from '@sentry/nestjs';
import { UpdateReportDto, TransitionReportDto } from 'src/common/dtos/updateUserReportDto';
import { ReportsRepository } from './reports.repository';
import { AIAnalysisService } from 'src/basics/ai/ai-analysis.service';
import { NigerianStates } from 'src/common/enums/nigeria-states.enum';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService,
    private reportRepo:ReportsRepository,
    private readonly aiService: AIAnalysisService,
  ) {}

  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('jwt')
  @Get('search')
  @ApiOperation({ summary: 'Search for ngo reports by location or incident name ' })
  @ApiResponse({
    status: 200,
    description: 'Reports retrieved successfully',
    type: [Report],
  })
  async searchReports(
    @Req() req,
    @Query('query') query?: string,
  ) {
    const userId = req.user.id;
    return this.reportRepo.findReports(userId, query);
  }
  @Post()
  @ApiOperation({ summary: 'Submit a report' })
  @ApiBody({
    description: 'Incident report data with optional files',
    schema: {
      type: 'object',
      properties: {

        location: {
          type: 'string',
          enum: Object.values(NigerianStates),
          description: 'Location where the incident occurred',
          example: 'Lagos',
        },
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
        description: {
          type: 'string',
          example: 'This is a description of the incident',
        },
        incident_type: {
          type: 'string',
          example: 'Harassment',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation error or missing required fields',
    schema: {
      example: {
        statusCode: 400,
        message: 'Invalid input data',
      },
    },
  })
  

  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  @UseInterceptors(FilesInterceptor('files', 2))
  @ApiConsumes('multipart/form-data')
  async createIncident(
    @Body() createIncidentDto: CreateIncidentDto,
    @Request() req: any,
    @UploadedFiles() files?: any,
  ): Promise<Report> {
    try {
      const userId = req.user?.id; // Optional - supports anonymous reports
      return await this.reportsService.createIncidentWithFile(
        createIncidentDto,
        files,
        userId,
      );
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('/:reportId')
  @ApiOperation({ summary: 'Get report' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Report  retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Report not found',
    schema: {
      example: {
        statusCode: 404,
        message: 'Report not found',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid UUID format',
    schema: {
      example: {
        statusCode: 400,
        message: 'Validation failed (uuid is expected)',
      },
    },
  })
  reportStatus(@Param('reportId', ParseUUIDPipe) reportId: string) {
    return this.reportsService.fetchReportStatus(reportId);
  }

  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('jwt')
  @Patch(':reportId')
  @ApiOperation({ summary: 'Update a report' })
  @ApiParam({ name: 'reportId', description: 'ID of the report to update' })
  @ApiResponse({ status: 200, description: 'The updated report' })
  @ApiResponse({ status: 400, description: 'Invalid UUID format' })
  @ApiResponse({ status: 404, description: 'Report not found' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden: Only the accepting NGO can update this report.',
  })
  @ApiResponse({
    status: 409,
    description:
      'Conflict: This report has been rejected and cannot be updated.',
  })
  async updateReport(
    @Param('reportId', ParseUUIDPipe) reportId: string,
    @Body() updateData: UpdateReportDto,
    @Req() req,
  ): Promise<Report> {
    const userFromJwt = req.user 
    return this.reportsService.updateReport(
      reportId,
      userFromJwt.id,
      updateData as any,
    );
  }

  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('jwt')
  @Post(':reportId/transition')
  @ApiOperation({ summary: 'Transition report through workflow (state machine)' })
  @ApiParam({ name: 'reportId', description: 'Report ID' })
  @ApiResponse({ status: 200, description: 'Report transitioned successfully' })
  @ApiResponse({ status: 400, description: 'Invalid transition' })
  async transitionReport(
    @Param('reportId', ParseUUIDPipe) reportId: string,
    @Body() dto: TransitionReportDto,
    @Req() req,
  ): Promise<Report> {
    return this.reportsService.transitionReport(reportId, req.user.id, dto.event, dto.reason);
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve all reports' })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved all reports. Returns an empty array if no reports exist.',
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async findAll(): Promise<Report[]> {
    const reports = await this.reportsService.findAll();
    return reports.length > 0 ? reports : [];
  }

  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('jwt')
  @Post(':reportId/assign')
  @ApiOperation({ summary: 'Assign a case worker to a report' })
  async assignCase(
    @Param('reportId', ParseUUIDPipe) reportId: string,
    @Body() body: { assigneeName: string },
    @Req() req,
  ) {
    const report = await this.reportRepo.fetchSingleReportById(reportId);
    if (!report) throw new NotFoundException('Report not found');
    if (!report.assignedUsers) report.assignedUsers = [];
    const name = body.assigneeName?.trim();
    if (!name) throw new BadRequestException('Assignee name is required');
    if (!report.assignedUsers.includes(name)) report.assignedUsers.push(name);
    return this.reportRepo.save(report);
  }

  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('jwt')
  @Post(':reportId/unassign')
  @ApiOperation({ summary: 'Remove a case worker from a report' })
  async unassignCase(
    @Param('reportId', ParseUUIDPipe) reportId: string,
    @Body() body: { assigneeName: string },
  ) {
    const report = await this.reportRepo.fetchSingleReportById(reportId);
    if (!report) throw new NotFoundException('Report not found');
    report.assignedUsers = (report.assignedUsers || []).filter(u => u !== body.assigneeName);
    return this.reportRepo.save(report);
  }

  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('jwt')
  @Post(':reportId/ai-chat')
  @ApiOperation({ summary: 'Ask AI about a specific case' })
  async aiChat(
    @Param('reportId', ParseUUIDPipe) reportId: string,
    @Body() body: { question: string },
  ) {
    if (!body.question?.trim()) throw new BadRequestException('Question is required');
    const report = await this.reportRepo.fetchSingleReportById(reportId);
    if (!report) throw new NotFoundException('Report not found');
    const answer = await this.aiService.askAboutCase(body.question, {
      description: report.description,
      incident_type: report.incident_type,
      ai_analysis: report.ai_analysis,
    });
    return { answer };
  }
}