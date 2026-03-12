import { Module, ValidationPipe } from '@nestjs/common';
import { SentryGlobalFilter, SentryModule } from '@sentry/nestjs/setup';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AuthsController } from './cores/authentication/auths.controller';
import { UsersService } from './basics/users/users.service';
import { UsersModule } from './basics/users/users.module';
import { User } from './common/entities/user.entity';
import { Report } from './common/entities/report.entity';
import { Notification } from './common/entities/notification.entity';
import { IncidentType } from './common/entities/incident-type.entity';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { LocalStrategy } from './cores/authentication/strategy/local-strategy';
import { JwtStrategy } from './cores/authentication/strategy/jwtStrategy';
import { ReportsModule } from './cores/reports/reports.module';
import { UsersRepository } from './basics/users/users.repository';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { AuthenticationService } from './cores/authentication/authentication.service';
import { AuthenticationModule } from './cores/authentication/authentication.module';
import { jwtConstants } from './cores/authentication/strategy/constants';
import { EmailModule } from './basics/email/email.module';
import { EmailService } from './basics/email/email.service';
import { NgoModule } from './cores/ngo/ngo.module';
import { NgoService } from './cores/ngo/ngo.service';
import { UsersController } from './basics/users/users.controller';
import { AuditLoggerService } from './common/services/audit-logger.service';
import { RetryService } from './common/services/retry.service';
import { AssignmentModule } from './cores/assignment/assignment.module';
import { CaseNotesModule } from './cores/case-notes/case-notes.module';
import { FollowUpsModule } from './cores/followups/followups.module';
import { CaseNote } from './common/entities/case-note.entity';
import { FollowUp } from './common/entities/followup.entity';
// import { QuestionsModule } from './basics/chats/questions.module'; // Removed - not migrated to TypeORM
// import { ReportAssignmentService } from './cores/reports/reports-assignment'; // Removed - not migrated to TypeORM
import { ScheduleModule } from '@nestjs/schedule';
import { NotificationsService } from './notifications/notifications.service';
import { NotificationController } from './notifications/notifications.controller';
import { NotificationModule } from './notifications/notifications.module';
import { IncidentTypeModule } from './basics/incident/incident.module';
import { ReportsRepository } from './cores/reports/reports.repository';
import { StorageModule } from './basics/storage/storage.module';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const databaseUrl = configService.get('DATABASE_URL');
        
        return {
          type: 'postgres',
          url: databaseUrl,
          entities: [User, Report, Notification, IncidentType, CaseNote, FollowUp],
          synchronize: true,
          ssl: { rejectUnauthorized: false },
          // Add connection pooling and retry logic
          extra: {
            max: 10,
            connectionTimeoutMillis: 30000,
            idleTimeoutMillis: 30000,
          },
        };
      },
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([User, Report, Notification, IncidentType]),
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: jwtConstants.LOGIN_EXPIRY },
    }),
    SentryModule.forRoot(),
    EmailModule,
    UsersModule,
    PassportModule,
    // QuestionsModule, // Removed - not migrated to TypeORM
    ReportsModule,
    NgoModule,
    AuthenticationModule,
    AssignmentModule,
    CaseNotesModule,
    FollowUpsModule,
    NotificationModule,
    IncidentTypeModule,
    StorageModule,
  ],
  controllers: [AppController, AuthsController, UsersController, NotificationController],
  providers: [
    UsersRepository,
    AppService,
    AuditLoggerService,
    RetryService,
    // ReportAssignmentService, // TODO: Migrate to TypeORM
    AuthenticationService,
    UsersService,
    JwtService,
    EmailService,
    ReportsRepository,
    LocalStrategy,
    JwtStrategy,
    NgoService,
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
    {
      provide: APP_FILTER,
      useClass: SentryGlobalFilter,
    },
    AuthenticationService,
    NotificationsService,
  ],
})
export class AppModule {}
