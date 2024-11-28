import { Module } from '@nestjs/common';
import { IncidentTypeService } from './incident.service';
import { IncidentTypeController } from './incident.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { IncidentType } from './schemas/incident.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: IncidentType.name, schema: IncidentTypeModule },
    ])
  ],
  controllers: [IncidentTypeController],
  providers: [IncidentTypeService],
})
export class IncidentTypeModule {}
