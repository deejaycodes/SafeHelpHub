import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationStatus } from 'src/common/entities/notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
  ) {}

  async createNotification(ngoId: string, reportId: string, message: string): Promise<Notification> {
    const notification = this.notificationRepository.create({
      ngoId,
      reportId,
      message,
      status: NotificationStatus.UNREAD,
    });
    return await this.notificationRepository.save(notification);
  }

  async getNotificationsByNgo(ngoId: string): Promise<Notification[]> {
    return await this.notificationRepository.find({
      where: { ngoId },
      order: { createdAt: 'DESC' },
    });
  }

  async markAsRead(notificationId: string): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId },
    });
    if (notification) {
      notification.status = NotificationStatus.READ;
      return await this.notificationRepository.save(notification);
    }
    return null;
  }

  async deleteNotification(notificationId: string): Promise<void> {
    await this.notificationRepository.delete(notificationId);
  }
}
