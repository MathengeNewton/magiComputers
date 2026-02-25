import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import * as multer from 'multer';
import { StoreController } from './store.controller';
import { StoreService } from './store.service';
import { StoreAuthModule } from './store-auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { CartModule } from '../cart/cart.module';
import { OrdersModule } from '../orders/orders.module';
import { AuthModule } from '../auth/auth.module';
import { MediaModule } from '../media/media.module';

@Module({
  imports: [
    PrismaModule,
    StoreAuthModule,
    CartModule,
    OrdersModule,
    AuthModule,
    MediaModule,
    MulterModule.register({ storage: multer.memoryStorage() }),
  ],
  controllers: [StoreController],
  providers: [StoreService],
})
export class StoreModule {}
