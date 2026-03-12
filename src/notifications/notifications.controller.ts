import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { NotificationsService } from './notifications.service';


@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth('jwt')
export class NotificationController {
  constructor(private readonly notificationService: NotificationsService) {}

  @ApiOperation({ summary: 'Get all notifications for authenticated NGO' })
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
  @Get()
  async getNotifications(@Req() req) {
    // Security: Use authenticated user ID from JWT, not from URL params
    return await this.notificationService.getAllNotifications(req.user.id);
  }

  @Get(':notificationId')
  @ApiOperation({
    summary: 'Get a single notification by ID for authenticated NGO',
  })
  @ApiParam({
    name: 'notificationId',
    type: String,
    description: 'The ID of the notification',
    example: '60f6b3eaf6477d49f87e9c8f',
  })
  @ApiResponse({
    status: 200,
    description: 'The notification for the authenticated NGO',
  })
  @ApiResponse({
    status: 404,
    description: 'No notification found or unauthorized',
  })
  async getNotificationById(
    @Param('notificationId') notificationId: string,
    @Req() req,
  ) {
    // Security: Use authenticated user ID from JWT
    return this.notificationService.getNotificationByNgoIdAndNotificationId(
      req.user.id,
      notificationId,
    );
  }
}
