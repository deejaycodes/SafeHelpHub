import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ReportSchema, Report } from './schemas/reports.schemas';
import { User, UserSchema } from 'src/common/schemas/users.schema';
import { UsersRepository } from 'src/basics/users/users.repository';
import { ReportsRepository } from './reports.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Report.name, schema: ReportSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  providers: [UsersRepository, ReportsRepository, ReportsService],
  controllers: [ReportsController],
})
export class ReportsModule {}
