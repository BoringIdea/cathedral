import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ResponseInterceptor } from './interceptors/response.interceptor';
import { HttpExceptionFilter } from './filters/http-exception.filter';

export async function createApp() {
  // const app = await NestFactory.create(AppModule);
  const expressApp = express();
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressApp),
  );

  app.enableCors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
  });

  app.setGlobalPrefix('api');

  // Apply global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Apply response interceptor globally
  app.useGlobalInterceptors(new ResponseInterceptor());

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Cathedral API')
    .setDescription(
      'Cathedral - Decentralized GitHub Repository Trading Platform API',
    )
    .setVersion('1.0')
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
    .addTag('auth', 'Authentication endpoints')
    .addTag('repositories', 'Repository management endpoints')
    .addTag('users', 'User management endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  return app;
}

async function bootstrap() {
  const app = await createApp();
  await app.listen(8080);
}
bootstrap();
