import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';


@ApiTags('Notifications')
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationsService) {}

  @ApiOperation({ summary: 'Get all notifications for an NGO' })
  @ApiResponse({
    status: 200,
    description: 'All notifications fetched successfully',
    schema: {
      example: [
        {
          _id: '60f6b3eaf6477d49f87e9c7f',
          ngoId: '60f6b3eaf6477d49f87e9c7f',
          reportId: '60f6b3eaf6477d49f87e9c7f',
          message: 'You have been assigned to handle a report.',
          status: 'UNREAD',
          createdAt: '2024-11-23T10:00:00.000Z',
          updatedAt: '2024-11-23T10:00:00.000Z',
        },
      ],
    },
  })
  @ApiResponse({ status: 404, description: 'NGO not found.' })
  @Get(':ngoId')
  async getNotifications(@Param('ngoId') ngoId: string) {
    return await this.notificationService.getAllNotifications(ngoId);
  }

  @Get(':ngoId/:notificationId')
  @ApiOperation({
    summary: 'Get a single notification by NGO ID and Notification ID',
  })
  @ApiParam({
    name: 'ngoId',
    type: String,
    description: 'The ID of the NGO',
    example: '60f6b3eaf6477d49f87e9c7f',
  })
  @ApiParam({
    name: 'notificationId',
    type: String,
    description: 'The ID of the notification',
    example: '60f6b3eaf6477d49f87e9c8f',
  })
  @ApiResponse({
    status: 200,
    description: 'The notification for the provided NGO ID and Notification ID',
  })
  @ApiResponse({
    status: 404,
    description: 'No notification found for the provided IDs',
  })
  async getNotificationByNgoIdAndNotificationId(
    @Param('ngoId') ngoId: string,
    @Param('notificationId') notificationId: string,
  ) {
    return this.notificationService.getNotificationByNgoIdAndNotificationId(
      ngoId,
      notificationId,
    );
  }
}
