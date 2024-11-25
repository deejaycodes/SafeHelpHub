import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel} from '@nestjs/mongoose';
import { Notification,NotificationDocument } from 'src/common/schemas/notification.schema';
import { Model } from 'mongoose'

@Injectable()
export class NotificationsService {

    constructor(
        @InjectModel(Notification.name) private notificationModel: Model<NotificationDocument>,
      ) {}

      async getAllNotifications(ngoId: string): Promise<Notification[]> {
        try {
          const notifications = await this.notificationModel
            .find({ ngoId })
            .populate('reportId') 
            .exec();
    
          return notifications;
        } catch (error) {
          throw new Error('Failed to fetch notifications: ' + error.message);
        }
      }

      async getNotificationByNgoIdAndNotificationId(
        ngoId: string,
        notificationId: string,
      ): Promise<Notification> {
        const notification = await this.notificationModel
          .findOne({ _id: notificationId, ngoId })
          .exec();
        if (!notification) {
          throw new NotFoundException(
            `No notification found for NGO ID: ${ngoId} and Notification ID: ${notificationId}`,
          );
        }
        return notification;
      }
      
}

