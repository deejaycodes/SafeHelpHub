import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CaseNotesService } from './case-notes.service';
import { CaseNotesController } from './case-notes.controller';
import { CaseNote } from 'src/common/entities/case-note.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CaseNote])],
  controllers: [CaseNotesController],
  providers: [CaseNotesService],
  exports: [CaseNotesService],
})
export class CaseNotesModule {}
