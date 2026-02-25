import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EnquiriesService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    tenantId: string,
    params: {
      type?: 'contact' | 'repair';
      status?: string;
      page?: number;
      limit?: number;
    } = {},
  ) {
    const { type, status, page = 1, limit = 20 } = params;
    const where: { tenantId: string; type?: string; status?: string } = { tenantId };
    if (type) where.type = type;
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      this.prisma.contactMessage.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.contactMessage.count({ where }),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(tenantId: string, id: string) {
    const enquiry = await this.prisma.contactMessage.findFirst({
      where: { id, tenantId },
      include: {
        ticketMessages: { orderBy: { createdAt: 'asc' } },
        ticketAttachments: true,
      },
    });
    if (!enquiry) {
      throw new NotFoundException('Enquiry not found');
    }
    return enquiry;
  }

  async addReply(tenantId: string, id: string, userId: string, body: string) {
    const enquiry = await this.prisma.contactMessage.findFirst({
      where: { id, tenantId },
    });
    if (!enquiry) throw new NotFoundException('Enquiry not found');
    return this.prisma.ticketMessage.create({
      data: {
        contactMessageId: id,
        senderType: 'staff',
        userId,
        body: body.trim(),
      },
    });
  }

  async update(
    tenantId: string,
    id: string,
    data: { status?: string; internalNote?: string },
  ) {
    await this.findOne(tenantId, id);
    return this.prisma.contactMessage.update({
      where: { id },
      data: {
        ...(data.status != null && { status: data.status }),
        ...(data.internalNote !== undefined && { internalNote: data.internalNote }),
      },
    });
  }
}
