import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IncidentTypeService } from './incident.service';
import { IncidentTypeController } from './incident.controller';
import { IncidentType } from 'src/common/entities/incident-type.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([IncidentType]),
  ],
  controllers: [IncidentTypeController],
  providers: [IncidentTypeService],
  exports: [IncidentTypeService],
})
export class IncidentTypeModule {}
