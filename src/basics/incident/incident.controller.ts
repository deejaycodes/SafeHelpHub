import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { CreateIncidentTypeDto } from './dto/create-incident.dto';
import { IncidentTypeService } from './incident.service';
import { IncidentType } from './schemas/incident.schema';


@ApiTags('Incident Types') // Grouping in Swagger
@Controller('incident-types')
export class IncidentTypeController {
  constructor(private readonly incidentService: IncidentTypeService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new incident type' })
  @ApiResponse({
    status: 201,
    description: 'The incident type has been successfully created.',
    type: IncidentType,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request: Validation errors or missing fields.',
  })
  create(@Body() createIncidentTypeDto: CreateIncidentTypeDto) {
    return this.incidentService.create(createIncidentTypeDto);
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve all incident types' })
  @ApiResponse({
    status: 200,
    description: 'List of all incident types.',
    type: [IncidentType],
  })
  findAll() {
    return this.incidentService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a specific incident type by ID' })
  @ApiParam({
    name: 'id',
    description: 'The unique identifier of the incident type',
    example: '64f4d2b10c4f2b9c7d2e8c8a',
  })
  @ApiResponse({
    status: 200,
    description: 'The incident type details.',
    type: IncidentType,
  })
  @ApiResponse({
    status: 404,
    description: 'Incident type not found.',
  })
  findOne(@Param('id') id: string) {
    return this.incidentService.findOne(id);
  }
}
