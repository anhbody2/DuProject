import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { MODELS } from './models';

/**
 * Connects to Postgres and registers every model globally so any service can
 * `@InjectModel(X)`. The schema is owned by sequelize-cli migrations
 * (see /database/migrations) - `synchronize` is intentionally off.
 */
@Global()
@Module({
  imports: [
    SequelizeModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        dialect: 'postgres',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: Number(config.get('DB_PORT', 5432)),
        username: config.get<string>('DB_USER', 'postgres'),
        password: config.get<string>('DB_PASSWORD', 'postgres'),
        database: config.get<string>('DB_NAME', 'food_marketplace'),
        models: MODELS,
        autoLoadModels: false,
        synchronize: false,
        logging: config.get('DB_LOGGING') === 'true' ? console.log : false,
      }),
    }),
    SequelizeModule.forFeature(MODELS),
  ],
  exports: [SequelizeModule],
})
export class DatabaseModule {}
