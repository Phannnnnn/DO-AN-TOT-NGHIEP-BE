import { config } from 'dotenv';
config();
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { ValidationError } from 'class-validator';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { parseAndValidateDate } from './common/utils/date.util';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      exceptionFactory: (validationErrors: ValidationError[] = []) => {
        return new BadRequestException(
          validationErrors.map((error) => ({
            field: error.property,
            error: error.constraints
              ? Object.values(error.constraints)[0]
              : 'Validation error',
          })),
        );
      },
    }),
  );

  //
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());

  app.enableCors({
    origin: process.env.FRONTEND_URL,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3000);
  console.log('\n http://localhost:' + process.env.PORT + '\n');
}
bootstrap();
