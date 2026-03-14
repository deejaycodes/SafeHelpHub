import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrackingController } from './tracking.controller';
import { Report } from 'src/common/entities/report.entity';
import { CaseNote } from 'src/common/entities/case-note.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Report, CaseNote])],
  controllers: [TrackingController],
})
export class TrackingModule {}
