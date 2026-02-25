import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StoreAuthService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(tenantId: string, data: { email: string; password: string; name: string; phone?: string }) {
    const { email, password, name, phone } = data;
    const existing = await this.prisma.customer.findUnique({
      where: { tenantId_email: { tenantId, email: email.trim().toLowerCase() } },
    });
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const customer = await this.prisma.customer.create({
      data: {
        tenantId,
        email: email.trim().toLowerCase(),
        passwordHash,
        name: name.trim(),
        phone: phone?.trim() || null,
      },
      select: { id: true, email: true, name: true, phone: true, tenantId: true },
    });
    return this.loginCustomer(customer);
  }

  async login(tenantId: string, email: string, password: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { tenantId_email: { tenantId, email: email.trim().toLowerCase() } },
    });
    if (!customer) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const valid = await bcrypt.compare(password, customer.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid email or password');
    }
    return this.loginCustomer({
      id: customer.id,
      email: customer.email,
      name: customer.name,
      phone: customer.phone,
      tenantId: customer.tenantId,
    });
  }

  private async loginCustomer(customer: {
    id: string;
    email: string;
    name: string;
    phone: string | null;
    tenantId: string;
  }) {
    const payload = { sub: customer.id, email: customer.email, tenantId: customer.tenantId };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '7d' });
    const refreshToken = randomBytes(32).toString('hex');
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await this.prisma.customerRefreshToken.create({
      data: {
        customerId: customer.id,
        tokenHash: refreshTokenHash,
        expiresAt,
      },
    });
    return {
      accessToken,
      refreshToken,
      customer: {
        id: customer.id,
        email: customer.email,
        name: customer.name,
        phone: customer.phone,
        tenantId: customer.tenantId,
      },
    };
  }

  async refresh(customerId: string, token: string) {
    const tokens = await this.prisma.customerRefreshToken.findMany({
      where: { customerId, expiresAt: { gt: new Date() } },
    });
    let validToken: { id: string; customer: { id: string; email: string; name: string; phone: string | null; tenantId: string } } | null = null;
    for (const rt of tokens) {
      const ok = await bcrypt.compare(token, rt.tokenHash);
      if (ok) {
        const withCustomer = await this.prisma.customerRefreshToken.findUnique({
          where: { id: rt.id },
          include: { customer: { select: { id: true, email: true, name: true, phone: true, tenantId: true } } },
        });
        if (withCustomer) validToken = withCustomer as any;
        break;
      }
    }
    if (!validToken) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
    await this.prisma.customerRefreshToken.deleteMany({ where: { customerId } });
    return this.loginCustomer(validToken.customer);
  }

  async logout(customerId: string) {
    await this.prisma.customerRefreshToken.deleteMany({ where: { customerId } });
    return { message: 'Logged out' };
  }

  async getProfile(customerId: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
      select: { id: true, email: true, name: true, phone: true, tenantId: true, createdAt: true },
    });
    if (!customer) return null;
    return customer;
  }

  async forgotPassword(tenantId: string, email: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { tenantId_email: { tenantId, email: email.trim().toLowerCase() } },
    });
    if (!customer) {
      return { message: 'If an account exists with this email, you will receive a reset link.' };
    }
    const token = randomBytes(32).toString('hex');
    const tokenHash = await bcrypt.hash(token, 10);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);
    await this.prisma.customerPasswordReset.create({
      data: { customerId: customer.id, tokenHash, expiresAt },
    });
    const resetLink = `${process.env.SHOP_URL || 'http://localhost:3003'}/reset-password?token=${token}`;
    console.log(`[StoreAuth] Password reset link for ${customer.email}: ${resetLink}`);
    return { message: 'If an account exists with this email, you will receive a reset link.', resetLink };
  }

  async resetPassword(token: string, newPassword: string) {
    const resets = await this.prisma.customerPasswordReset.findMany({
      where: { expiresAt: { gt: new Date() } },
      include: { customer: true },
    });
    let validReset: (typeof resets)[0] | null = null;
    for (const r of resets) {
      const ok = await bcrypt.compare(token, r.tokenHash);
      if (ok) {
        validReset = r;
        break;
      }
    }
    if (!validReset) {
      throw new BadRequestException('Invalid or expired reset token');
    }
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.customer.update({
      where: { id: validReset.customerId },
      data: { passwordHash },
    });
    await this.prisma.customerPasswordReset.deleteMany({ where: { customerId: validReset.customerId } });
    return { message: 'Password reset successfully' };
  }
}
