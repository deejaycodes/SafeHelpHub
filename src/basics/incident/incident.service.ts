import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateIncidentTypeDto } from './dto/create-incident.dto';
//import { UpdateIncidentDto } from './dto/update-incident.dto';
import { InjectModel} from '@nestjs/mongoose';
import { Model, Types } from 'mongoose'
import { IncidentType, IncidentTypeDocument } from './entities/incident.schema';

@Injectable()
export class IncidentTypeService {
  constructor(
    @InjectModel( IncidentType.name) private incidentModel: Model<IncidentTypeDocument>,
  ) {}
   async  create(createIncidentTypeDto: CreateIncidentTypeDto):Promise<IncidentType> {
    const incidentType =  new this.incidentModel(createIncidentTypeDto)
    return await incidentType.save()
  }

  findAll() {
    return this.incidentModel.find();
  }

  async findOne(incidentTypeId:  Types.ObjectId | string) :Promise<IncidentType | null>{

    try{
      const objectId =
      typeof incidentTypeId === 'string' ? new Types.ObjectId(incidentTypeId) : incidentTypeId;
      const incidentType = await this.incidentModel.findById(objectId).exec();
      if (!incidentType) {
        throw new NotFoundException(`Incident with ID ${objectId} not found`);
      }
      return incidentType
    }catch (error) {
      throw new NotFoundException(`Error fetching report: ${error.message}`);
    }
    
  }
}
