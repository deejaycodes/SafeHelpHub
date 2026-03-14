import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ResourcesController } from './resources.controller';
import { User } from 'src/common/entities/user.entity';
import { IncidentType } from 'src/common/entities/incident-type.entity';
import { UsersRepository } from 'src/basics/users/users.repository';

@Module({
  imports: [TypeOrmModule.forFeature([User, IncidentType])],
  controllers: [ResourcesController],
  providers: [UsersRepository],
})
export class ResourcesModule {}
