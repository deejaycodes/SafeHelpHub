import * as Sentry from '@sentry/nestjs';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import helmet from 'helmet';
import { SanitizePipe } from './common/pipes/sanitize.pipe';

async function bootstrap() {
  Sentry.init({
    dsn: 'https://2d9e3cdeb9e5125d595804a66b8ea621@o4507968990609408.ingest.de.sentry.io/4507968998342736',
    integrations: [nodeProfilingIntegration()],
    tracesSampleRate: 1.0,
    profilesSampleRate: 1.0,
  });
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  const { Logger: PinoLogger } = await import('nestjs-pino');
  app.useLogger(app.get(PinoLogger));

  app.use(helmet());

  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.useGlobalPipes(
    new SanitizePipe(),
    new ValidationPipe({
      errorHttpStatusCode: 400,
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const options = new DocumentBuilder()
    .setTitle('SafeVoice API')
    .setDescription(`
# SafeVoice - FGM Reporting & Support Platform API

## Overview
SafeVoice is a secure platform for reporting and managing Female Genital Mutilation (FGM) and violence cases in Nigeria. This API provides endpoints for:

- **Anonymous Reporting**: Submit incidents without revealing identity
- **NGO Management**: Connect victims with support organizations
- **AI Analysis**: Automated incident assessment and urgency classification
- **Case Tracking**: Monitor report status and resolution

## Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:
\`\`\`
Authorization: Bearer <your_jwt_token>
\`\`\`

## Base URL
- **Production**: https://safehelpub-api.onrender.com
- **Local**: http://localhost:3000

## Key Features
- 🔒 End-to-end encryption for sensitive data
- 🤖 AI-powered incident analysis
- 📧 Email notifications
- 📊 Real-time reporting
- 🏥 NGO matching based on incident type

## Support
For issues or questions, contact: support@safevoice.org
    `)
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Authentication', 'User registration and login endpoints')
    .addTag('Reports', 'Incident reporting and management')
    .addTag('NGO', 'NGO registration and search')
    .addTag('Users', 'User profile and account management')
    .addTag('Incident Types', 'Manage incident categories')
    .addTag('Notifications', 'Notification management for NGOs')
    .addServer('https://safehelpub-api.onrender.com', 'Production Server')
    .addServer('http://localhost:3000', 'Local Development')
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, options);

  app.use('/support-json', (req, res) => {
    res.json(swaggerDocument);
  });
  
  SwaggerModule.setup('/support', app, swaggerDocument, {
    customCss:
      '.swagger-ui .opblock .opblock-summary-path-description-wrapper { align-items: center; display: flex; flex-wrap: wrap; gap: 0 10px; padding: 0 10px; width: 100%; }',
    customCssUrl:
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css',
    customJs: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-bundle.js',
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-standalone-preset.js',
    ],
  });
  await app.listen(3000);
}
bootstrap();
