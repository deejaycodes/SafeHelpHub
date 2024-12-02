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
} from '@nestjs/common';
import { CreateIncidentDto } from '../../common/dtos/reportsDto';
import { Report, ReportDocument } from './schemas/reports.schemas';
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
import { UpdateReportDto } from 'src/common/dtos/updateUserReportDto';
import { ReportsRepository } from './reports.repository';
import { NigerianStates } from 'src/common/enums/nigeria-states.enum';
import { ReportAssignment } from './schemas/report_status.schema';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService,
    private reportRepo:ReportsRepository
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
    
      return await this.reportsService.createIncidentWithFile(
        createIncidentDto,
        files,
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
  reportStatus(@Param('reportId') reportId: string) {
    return this.reportsService.fetchReportStatus(reportId);
  }

  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('jwt')
  @Patch(':reportId')
  @ApiOperation({ summary: 'Update a report' })
  @ApiParam({ name: 'reportId', description: 'ID of the report to update' })
  @ApiResponse({ status: 200, description: 'The updated report' })
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
    @Param('reportId') reportId: string,
    @Body() updateData: UpdateReportDto,
    @Req() req,
  ): Promise<ReportDocument> {
    const userFromJwt = req.user 
    return this.reportsService.updateReport(
      reportId,
      userFromJwt.id,
      updateData,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve all reports' })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved all reports. Returns an empty array if no reports exist.',
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async findAll(): Promise<ReportDocument[]> {
    const reports = await this.reportsService.findAll();
    return reports.length > 0 ? reports : [];
  }

  
}