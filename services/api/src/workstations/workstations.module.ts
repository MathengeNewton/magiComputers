import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { WorkstationsController } from './workstations.controller';
import { WorkstationsService } from './workstations.service';

@Module({
  imports: [PrismaModule],
  controllers: [WorkstationsController],
  providers: [WorkstationsService],
  exports: [WorkstationsService],
})
export class WorkstationsModule {}
