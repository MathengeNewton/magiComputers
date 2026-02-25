import { Module } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from '../prisma/prisma.service';
import { StoreAuthService } from './store-auth.service';

@Module({
  imports: [
    PrismaModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET') || 'change-me-in-production',
        signOptions: { expiresIn: '7d' },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [
    {
      provide: StoreAuthService,
      useFactory: (prisma: PrismaService, jwtService: JwtService) => {
        return new StoreAuthService(prisma, jwtService);
      },
      inject: [PrismaService, JwtService],
    },
  ],
  exports: [StoreAuthService],
})
export class StoreAuthModule {}
