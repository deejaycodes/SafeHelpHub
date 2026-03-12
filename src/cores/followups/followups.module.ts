import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FollowUpsService } from './followups.service';
import { FollowUpsController } from './followups.controller';
import { FollowUp } from 'src/common/entities/followup.entity';
import { Report } from 'src/common/entities/report.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FollowUp, Report])],
  controllers: [FollowUpsController],
  providers: [FollowUpsService],
  exports: [FollowUpsService],
})
export class FollowUpsModule {}
