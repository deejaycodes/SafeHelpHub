import * as Sentry from '@sentry/nestjs';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

async function bootstrap() {
  Sentry.init({
    dsn: 'https://2d9e3cdeb9e5125d595804a66b8ea621@o4507968990609408.ingest.de.sentry.io/4507968998342736',
    integrations: [nodeProfilingIntegration()],
    tracesSampleRate: 1.0,
    profilesSampleRate: 1.0,
  });
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      errorHttpStatusCode: 400,
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const options = new DocumentBuilder()
    .setTitle('ANONYMOUS REPORTING AND SUPPORT PLATFORM API COLLECTIONS')
    .setDescription('Anonymous Reporting and Support Platform Server')
    .setVersion('1.0')
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
