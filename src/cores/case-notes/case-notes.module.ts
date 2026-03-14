import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CaseNotesService } from './case-notes.service';
import { CaseNotesController } from './case-notes.controller';
import { CaseNote } from 'src/common/entities/case-note.entity';
import { Report } from 'src/common/entities/report.entity';
import { EmailModule } from 'src/basics/email/email.module';

@Module({
  imports: [TypeOrmModule.forFeature([CaseNote, Report]), EmailModule],
  controllers: [CaseNotesController],
  providers: [CaseNotesService],
  exports: [CaseNotesService],
})
export class CaseNotesModule {}
