import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ReportSchema, Report } from './schemas/reports.schemas';
import { UsersService } from 'src/users/users.service';
import { User, UserSchema } from 'src/users/schemas/users.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Report.name, schema: ReportSchema }, { name: User.name, schema: UserSchema }]),
  ],
  providers: [ReportsService, UsersService],
  controllers: [ReportsController]
})
export class ReportsModule {}
