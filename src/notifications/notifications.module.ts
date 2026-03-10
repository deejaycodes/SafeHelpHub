import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { Notification } from 'src/common/entities/notification.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification]),
  ],
  controllers: [NotificationController],
  providers: [NotificationsService], 
  exports: [NotificationsService], 
})
export class NotificationModule {}
