import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateIncidentTypeDto } from './dto/create-incident.dto';
import { IncidentType } from 'src/common/entities/incident-type.entity';

@Injectable()
export class IncidentTypeService {
  constructor(
    @InjectRepository(IncidentType)
    private incidentRepository: Repository<IncidentType>,
  ) {}

  async create(createIncidentTypeDto: CreateIncidentTypeDto): Promise<IncidentType> {
    const incidentType = this.incidentRepository.create(createIncidentTypeDto);
    return await this.incidentRepository.save(incidentType);
  }

  async findAll(): Promise<IncidentType[]> {
    return await this.incidentRepository.find();
  }

  async findOne(incidentTypeId: string): Promise<IncidentType | null> {
    const incidentType = await this.incidentRepository.findOne({
      where: { id: incidentTypeId },
    });
    if (!incidentType) {
      throw new NotFoundException(`Incident with ID ${incidentTypeId} not found`);
    }
    return incidentType;
  }
}
