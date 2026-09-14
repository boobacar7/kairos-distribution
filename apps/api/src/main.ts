import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';
import { parseApiEnv } from '@kairos/config';
import helmet from 'helmet';

import { AppModule } from './app.module.js';
import { ApiExceptionFilter } from './common/api-exception.filter.js';
import { GLOBAL_PREFIX_OPTIONS } from './http.js';

async function bootstrap(): Promise<void> {
  const env = parseApiEnv();
  const app = await NestFactory.create(AppModule, { abortOnError: true });
  app.use(helmet());
  app.setGlobalPrefix('v1', GLOBAL_PREFIX_OPTIONS);
  if (env.CORS_ORIGIN) {
    app.enableCors({ origin: env.CORS_ORIGIN });
  }
  app.useGlobalFilters(new ApiExceptionFilter());
  await app.listen(env.PORT, '0.0.0.0');
}

void bootstrap();
