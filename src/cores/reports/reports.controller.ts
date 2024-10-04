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
} from '@nestjs/common';
import { CreateIncidentDto } from '../../common/dtos/reportsDto';
import { Report } from './schemas/reports.schemas';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from 'src/cores/authentication/strategy/jwt-guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import * as _ from 'lodash';

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
  @ApiOperation({ summary: 'Get status of a report' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Report status retrieved successfully',
    schema: {
      example: {
        id: 'report123',
        status: 'Pending',
        description: 'Report description',
      },
    },
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
}

