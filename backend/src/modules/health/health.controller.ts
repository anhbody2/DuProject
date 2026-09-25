import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';

@Controller('health')
export class HealthController {
  constructor(private readonly sequelize: Sequelize) {}

  @Get()
  async check() {
    try {
      await this.sequelize.authenticate();
    } catch {
      throw new ServiceUnavailableException({ status: 'error', database: 'down' });
    }
    return { status: 'ok', database: 'up', time: new Date().toISOString() };
  }
}
