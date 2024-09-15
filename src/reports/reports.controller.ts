import { BadRequestException, Body, Controller, Post,Request, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { CreateIncidentDto } from './dtos/reports.dto';
import { Report } from './schemas/reports.schemas';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from 'src/users/strategy/jwt-guard';
import * as _ from 'lodash';

@Controller('reports')
export class ReportsController {
    constructor(private readonly reportsService: ReportsService) {}

    @Post()
    @UseGuards(JwtAuthGuard)
    @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    async createIncident(@Body() createIncidentDto: CreateIncidentDto, @Request() req: any): Promise<Report> {
        try {
            const userId = _.get(req, 'user.id', null);
            return await this.reportsService.createIncident(createIncidentDto, userId);
        } catch (error) {
            throw new BadRequestException(error.message);
        }
  }

}
