import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type WorkstationInput = {
  title: string;
  slug: string;
  summary?: string;
  description?: string;
  coverMediaId?: string | null;
  status?: 'draft' | 'published';
  sortOrder?: number;
  products?: Array<{ productId: string; order?: number; isPrimary?: boolean }>;
};

@Injectable()
export class WorkstationsService {
  constructor(private prisma: PrismaService) {}

  private async assertUniqueSlug(tenantId: string, slug: string, exceptId?: string) {
    const existing = await this.prisma.workstation.findFirst({
      where: {
        tenantId,
        slug,
        ...(exceptId ? { id: { not: exceptId } } : {}),
      },
      select: { id: true },
    });

    if (existing) throw new BadRequestException(`Workstation with slug "${slug}" already exists`);
  }

  private async normalizeProducts(tenantId: string, products: WorkstationInput['products']) {
    const entries = products ?? [];
    const productIds = [...new Set(entries.map((entry) => entry.productId))];
    if (productIds.length === 0) return [];

    const found = await this.prisma.product.findMany({
      where: { tenantId, id: { in: productIds } },
      select: { id: true },
    });
    const foundIds = new Set(found.map((item) => item.id));
    const missing = productIds.filter((id) => !foundIds.has(id));
    if (missing.length > 0) {
      throw new BadRequestException('Some linked products were not found for this tenant');
    }

    return entries.map((entry, index) => ({
      productId: entry.productId,
      order: Number.isFinite(entry.order as number) ? Number(entry.order) : index,
      isPrimary: !!entry.isPrimary,
    }));
  }

  async findAll(tenantId: string) {
    return this.prisma.workstation.findMany({
      where: { tenantId },
      include: {
        coverMedia: { select: { id: true, url: true } },
        products: {
          orderBy: [{ isPrimary: 'desc' }, { order: 'asc' }, { createdAt: 'asc' }],
          include: {
            product: { select: { id: true, title: true, slug: true } },
          },
        },
        _count: { select: { products: true } },
      },
      orderBy: [{ sortOrder: 'asc' }, { updatedAt: 'desc' }],
    });
  }

  async findOne(tenantId: string, id: string) {
    const workstation = await this.prisma.workstation.findFirst({
      where: { tenantId, id },
      include: {
        coverMedia: { select: { id: true, url: true } },
        products: {
          orderBy: [{ isPrimary: 'desc' }, { order: 'asc' }, { createdAt: 'asc' }],
          include: {
            product: {
              select: {
                id: true,
                title: true,
                slug: true,
                currency: true,
                listPrice: true,
                status: true,
                images: {
                  include: { media: true },
                  orderBy: { order: 'asc' },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    if (!workstation) throw new NotFoundException(`Workstation with id "${id}" not found`);
    return workstation;
  }

  async create(tenantId: string, data: WorkstationInput) {
    if (!data.title?.trim()) throw new BadRequestException('title is required');
    if (!data.slug?.trim()) throw new BadRequestException('slug is required');

    await this.assertUniqueSlug(tenantId, data.slug.trim());
    const normalizedProducts = await this.normalizeProducts(tenantId, data.products);

    return this.prisma.workstation.create({
      data: {
        tenantId,
        title: data.title.trim(),
        slug: data.slug.trim(),
        summary: data.summary?.trim() || null,
        description: data.description?.trim() || null,
        coverMediaId: data.coverMediaId || null,
        status: data.status || 'draft',
        sortOrder: Number.isFinite(data.sortOrder as number) ? Number(data.sortOrder) : 0,
        products: normalizedProducts.length
          ? {
              createMany: {
                data: normalizedProducts,
              },
            }
          : undefined,
      },
      include: {
        coverMedia: { select: { id: true, url: true } },
        products: {
          include: { product: { select: { id: true, title: true, slug: true } } },
          orderBy: [{ isPrimary: 'desc' }, { order: 'asc' }],
        },
      },
    });
  }

  async update(tenantId: string, id: string, data: Partial<WorkstationInput>) {
    await this.findOne(tenantId, id);

    if (data.slug?.trim()) {
      await this.assertUniqueSlug(tenantId, data.slug.trim(), id);
    }
    const normalizedProducts =
      data.products !== undefined ? await this.normalizeProducts(tenantId, data.products) : undefined;

    return this.prisma.$transaction(async (tx) => {
      if (normalizedProducts !== undefined) {
        await tx.workstationProduct.deleteMany({ where: { workstationId: id } });
      }

      const updated = await tx.workstation.update({
        where: { id },
        data: {
          ...(data.title !== undefined ? { title: data.title.trim() } : {}),
          ...(data.slug !== undefined ? { slug: data.slug.trim() } : {}),
          ...(data.summary !== undefined ? { summary: data.summary?.trim() || null } : {}),
          ...(data.description !== undefined ? { description: data.description?.trim() || null } : {}),
          ...(data.coverMediaId !== undefined ? { coverMediaId: data.coverMediaId || null } : {}),
          ...(data.status !== undefined ? { status: data.status } : {}),
          ...(data.sortOrder !== undefined ? { sortOrder: Number(data.sortOrder) || 0 } : {}),
        },
      });

      if (normalizedProducts && normalizedProducts.length > 0) {
        await tx.workstationProduct.createMany({
          data: normalizedProducts.map((entry) => ({
            workstationId: id,
            productId: entry.productId,
            order: entry.order,
            isPrimary: entry.isPrimary,
          })),
        });
      }

      return updated;
    });
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    return this.prisma.workstation.delete({ where: { id } });
  }
}
