import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, includeInactive = true) {
    const where: { tenantId: string; active?: boolean } = { tenantId };
    if (!includeInactive) where.active = true;
    return this.prisma.client.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const client = await this.prisma.client.findFirst({
      where: { tenantId, id },
    });
    if (!client) throw new NotFoundException(`Client with id "${id}" not found`);
    return client;
  }

  async getDetail(tenantId: string, id: string) {
    const client = await this.prisma.client.findFirst({
      where: { tenantId, id },
    });
    if (!client) throw new NotFoundException(`Client with id "${id}" not found`);
    return {
      ...client,
      postCountByStatus: {} as Record<string, number>,
      totalPosts: 0,
    };
  }

  async setActive(tenantId: string, id: string, active: boolean) {
    await this.findOne(tenantId, id);
    return this.prisma.client.update({
      where: { id },
      data: { active },
    });
  }

  async create(tenantId: string, data: { name: string }) {
    const name = (data.name || '').trim();
    if (!name) throw new BadRequestException('Client name is required');

    return this.prisma.client.create({
      data: { tenantId, name },
    });
  }

  async update(tenantId: string, id: string, data: { name?: string }) {
    await this.findOne(tenantId, id);
    const name = data.name?.trim();
    if (name !== undefined && !name) throw new BadRequestException('Client name cannot be empty');

    return this.prisma.client.update({
      where: { id },
      data: { ...(name !== undefined ? { name } : {}) },
    });
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    await this.prisma.client.delete({ where: { id } });
    return { success: true };
  }

  async socialSummary(tenantId: string, clientId: string) {
    // Destinations are tenant-scoped (clientId removed from Integration)
    const destinationsCount = await this.prisma.destination.count({
      where: {
        integration: { tenantId },
      },
    });

    return {
      clientId,
      hasAnyDestination: destinationsCount > 0,
      destinationsCount,
    };
  }
}

