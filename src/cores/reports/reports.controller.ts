import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
  HttpStatus,
  Patch,
  Req,
} from '@nestjs/common';
import { CreateIncidentDto } from '../../common/dtos/reportsDto';
import { Report, ReportDocument } from './schemas/reports.schemas';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from 'src/cores/authentication/strategy/jwt-guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import * as _ from 'lodash';
import { User } from '@sentry/nestjs';

@ApiTags('reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  @ApiOperation({ summary: 'Submit a report' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Report submitted successfully',
    schema: {
      example: {
        id: 'report123',
        status: 'Pending',
        description: 'Report description',
        created_at: '2024-10-04T08:00:00Z',
        user_id: 'user123',
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
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async createIncident(
    @Body() createIncidentDto: CreateIncidentDto,
    @Request() req: any,
  ): Promise<Report> {
    try {
      const userId = _.get(req, 'user.id', null);
      return await this.reportsService.createIncident(createIncidentDto, userId);
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

  @Put('upload_file/:reportId')
  @ApiOperation({ summary: 'Upload file related to a report' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'File uploaded successfully',
    schema: {
      example: {
        message: 'File uploaded successfully',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid file or upload error',
    schema: {
      example: {
        statusCode: 400,
        message: 'File format not supported',
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  uploadVerifications(
    @Param('reportId') reportId: string,
    @UploadedFile() file: any,
  ) {
    return this.reportsService.uploadReportFile(reportId, file);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth() 
  @Patch(':reportId')
  @ApiOperation({ summary: 'Update a report' })
  @ApiParam({ name: 'reportId', description: 'ID of the report to update' })
  @ApiResponse({ status: 200, description: 'The updated report' })
  @ApiResponse({ status: 404, description: 'Report not found' })
  @ApiResponse({ status: 403, description: 'Forbidden: Only the accepting NGO can update this report.' })
  @ApiResponse({ status: 409, description: 'Conflict: This report has been rejected and cannot be updated.' })
  async updateReport(
    @Param('reportId') reportId: string,
    @Body() updateData: Partial<ReportDocument>,
    @Req() req
  ): Promise<ReportDocument> {
    const userFromJwt = req.user as User
    return this.reportsService.updateReport(reportId, userFromJwt.id, updateData);
  }
}


