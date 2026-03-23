import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { StorefrontConfigController } from './storefront-config.controller';
import { StorefrontConfigService } from './storefront-config.service';

@Module({
  imports: [PrismaModule],
  controllers: [StorefrontConfigController],
  providers: [StorefrontConfigService],
  exports: [StorefrontConfigService],
})
export class StorefrontConfigModule {}
