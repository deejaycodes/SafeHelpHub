import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OnEvent } from '@nestjs/event-emitter';
import { Notification, NotificationStatus } from 'src/common/entities/notification.entity';
import { REPORT_EVENTS } from 'src/common/events/event-names';
import { ReportUrgentEvent } from 'src/common/events/event-payloads';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

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

  async getAllNotifications(ngoId: string): Promise<Notification[]> {
    return await this.getNotificationsByNgo(ngoId);
  }

  async getNotificationByNgoIdAndNotificationId(ngoId: string, notificationId: string): Promise<Notification> {
    return await this.notificationRepository.findOne({
      where: { id: notificationId, ngoId },
    });
  }

  /**
   * Event Listener: Send notifications for urgent reports
   */
  @OnEvent(REPORT_EVENTS.URGENT)
  async handleUrgentReport(payload: ReportUrgentEvent) {
    this.logger.warn(`🚨 URGENT REPORT: ${payload.reportId} - ${payload.classification} (${payload.urgency})`);

    try {
      // TODO: Get NGOs in the report's location
      // For now, create a notification for all NGOs (you can filter by location later)
      const message = `🚨 URGENT: ${payload.classification} report in ${payload.location || 'Unknown location'}. Urgency: ${payload.urgency.toUpperCase()}`;

      // TODO: Query NGOs from database and send to relevant ones
      // For now, just log (you can add SMS/Email integration later)
      this.logger.log(`Notification ready: ${message}`);
      
      // TODO: Integrate with SMS/Email service
      // await this.sendSMS(ngoPhoneNumber, message);
      // await this.sendEmail(ngoEmail, message);

    } catch (error) {
      this.logger.error(`Failed to send urgent notification for report ${payload.reportId}: ${error.message}`);
    }
  }
}
