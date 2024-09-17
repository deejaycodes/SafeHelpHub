import {
  BadRequestException,
  Body,
  Controller,
  Param,
  Post,
  Put,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { CreateIncidentDto } from '../../common/dtos/reports.dto';
import { Report } from './schemas/reports.schemas';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from 'src/cores/authentication/strategy/jwt-guard';
import * as _ from 'lodash';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  @ApiOperation({ summary: 'submit a report' })
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async createIncident(
    @Body() createIncidentDto: CreateIncidentDto,
    @Request() req: any,
  ): Promise<Report> {
    try {
      const userId = _.get(req, 'user.id', null);
      return await this.reportsService.createIncident(
        createIncidentDto,
        userId,
      );
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Put('upload_file/:reportId')
  @ApiOperation({ summary: 'upload file' })
  @UseInterceptors(FileInterceptor('file'))
  uploadVerifications(
    @Param('reportId') reportId: string,
    @UploadedFile() file: any,
  ) {
    return this.reportsService.uploadReportFile(reportId, file);
  }
}
