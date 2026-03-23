import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StoreService {
  constructor(private prisma: PrismaService) {}

  async getCategories(tenantId?: string, withProductCount?: boolean) {
    if (!tenantId) return [];

    const categories = await this.prisma.productCategory.findMany({
      where: { tenantId },
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
      include:
        withProductCount
          ? { _count: { select: { products: true } } }
          : undefined,
    });
    return categories.map((c) => {
      const base = { id: c.id, name: c.name, slug: c.slug, order: c.order };
      if (withProductCount && '_count' in c) {
        return { ...base, productCount: (c as any)._count?.products ?? 0 };
      }
      return base;
    });
  }

  async getProducts(options: {
    page: number;
    limit: number;
    search?: string;
    categoryId?: string;
    categorySlug?: string;
    minPrice?: number;
    maxPrice?: number;
    supplierId?: string;
    tenantId?: string;
  }) {
    const where: any = {
      status: 'published',
    };

    if (options.tenantId) {
      where.tenantId = options.tenantId;
    }

    if (options.categoryId) {
      where.categoryId = options.categoryId;
    }

    if (options.categorySlug) {
      const cat = await this.prisma.productCategory.findFirst({
        where: { slug: options.categorySlug },
        select: { id: true },
      });
      if (cat) where.categoryId = cat.id;
    }

    if (options.supplierId) {
      where.supplierId = options.supplierId;
    }

    if (options.minPrice != null || options.maxPrice != null) {
      where.listPrice = {};
      if (options.minPrice != null) where.listPrice.gte = options.minPrice;
      if (options.maxPrice != null) where.listPrice.lte = options.maxPrice;
    }

    if (options.search) {
      where.OR = [
        { title: { contains: options.search, mode: 'insensitive' } },
        { description: { contains: options.search, mode: 'insensitive' } },
      ];
    }

    const skip = (options.page - 1) * options.limit;

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: options.limit,
        include: {
          supplier: true,
          category: { select: { id: true, name: true, slug: true } },
          variants: true,
          images: {
            include: {
              media: true,
            },
            orderBy: {
              order: 'asc',
            },
            take: 1,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      products,
      pagination: {
        page: options.page,
        limit: options.limit,
        total,
        totalPages: Math.ceil(total / options.limit),
      },
    };
  }

  async getProduct(slug: string, tenantId?: string) {
    const where: any = {
      slug,
      status: 'published',
    };

    if (tenantId) {
      where.tenantId = tenantId;
    }

    const product = await this.prisma.product.findFirst({
      where,
      include: {
        supplier: true,
        variants: {
          where: {
            stock: {
              gt: 0,
            },
          },
        },
        images: {
          include: {
            media: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with slug "${slug}" not found`);
    }

    return product;
  }

  async getFeaturedProducts(tenantId?: string, limit = 8) {
    if (!tenantId) return [];

    return this.prisma.product.findMany({
      where: {
        tenantId,
        status: 'published',
        isFeaturedHome: true,
      },
      include: {
        supplier: true,
        category: { select: { id: true, name: true, slug: true } },
        images: {
          include: { media: true },
          orderBy: { order: 'asc' },
          take: 1,
        },
      },
      orderBy: [{ featuredOrder: 'asc' }, { updatedAt: 'desc' }],
      take: Math.min(20, Math.max(1, limit)),
    });
  }

  async getHomepageConfig(tenantId?: string) {
    if (!tenantId) {
      return {
        heroEyebrow: 'MagiComputers',
        heroTitle: 'Electronics and repairs done right.',
        heroDescription:
          'From custom workstation builds to day-to-day devices, we supply quality gear and dependable repair support for homes and offices.',
        heroImageUrl: null,
        primaryButtonLabel: 'Shop now',
        primaryButtonHref: '/shop',
        secondaryButtonLabel: 'Book repair',
        secondaryButtonHref: '/repair',
      };
    }

    const config = await this.prisma.storefrontConfig.findUnique({
      where: { tenantId },
      include: { heroImageMedia: { select: { url: true } } },
    });

    if (!config) {
      return {
        heroEyebrow: 'MagiComputers',
        heroTitle: 'Electronics and repairs done right.',
        heroDescription:
          'From custom workstation builds to day-to-day devices, we supply quality gear and dependable repair support for homes and offices.',
        heroImageUrl: null,
        primaryButtonLabel: 'Shop now',
        primaryButtonHref: '/shop',
        secondaryButtonLabel: 'Book repair',
        secondaryButtonHref: '/repair',
      };
    }

    return {
      heroEyebrow: config.heroEyebrow,
      heroTitle: config.heroTitle,
      heroDescription: config.heroDescription,
      heroImageUrl: config.heroImageMedia?.url ?? null,
      primaryButtonLabel: config.primaryButtonLabel,
      primaryButtonHref: config.primaryButtonHref,
      secondaryButtonLabel: config.secondaryButtonLabel,
      secondaryButtonHref: config.secondaryButtonHref,
    };
  }

  async getWorkstations(tenantId?: string, limit = 6) {
    if (!tenantId) return [];

    const items = await this.prisma.workstation.findMany({
      where: { tenantId, status: 'published' },
      include: {
        coverMedia: { select: { url: true } },
        products: {
          orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
          include: {
            product: {
              select: {
                id: true,
                title: true,
                slug: true,
                currency: true,
                listPrice: true,
                price: true,
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
      orderBy: [{ sortOrder: 'asc' }, { updatedAt: 'desc' }],
      take: Math.min(20, Math.max(1, limit)),
    });

    return items.map((item) => ({
      id: item.id,
      slug: item.slug,
      title: item.title,
      summary: item.summary,
      coverImageUrl: item.coverMedia?.url ?? null,
      productCount: item.products.length,
      linkedProductsPreview: item.products.slice(0, 4).map((entry) => ({
        id: entry.product.id,
        title: entry.product.title,
        slug: entry.product.slug,
      })),
    }));
  }

  async getWorkstationBySlug(slug: string, tenantId?: string) {
    if (!tenantId) throw new NotFoundException('Workstation not found');

    const item = await this.prisma.workstation.findFirst({
      where: { tenantId, slug, status: 'published' },
      include: {
        coverMedia: { select: { url: true } },
        products: {
          orderBy: [{ isPrimary: 'desc' }, { order: 'asc' }, { createdAt: 'asc' }],
          include: {
            product: {
              include: {
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

    if (!item) throw new NotFoundException('Workstation not found');

    return {
      id: item.id,
      slug: item.slug,
      title: item.title,
      summary: item.summary,
      description: item.description,
      coverImageUrl: item.coverMedia?.url ?? null,
      products: item.products.map((entry) => ({
        id: entry.product.id,
        slug: entry.product.slug,
        title: entry.product.title,
        description: entry.product.description,
        currency: entry.product.currency,
        price: entry.product.price,
        listPrice: entry.product.listPrice,
        imageUrl: entry.product.images[0]?.media?.url ?? null,
        isPrimary: entry.isPrimary,
      })),
    };
  }

  async getOrderByPublicId(publicId: string) {
    const order = await this.prisma.order.findUnique({
      where: { publicId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with publicId "${publicId}" not found`);
    }

    return {
      publicId: order.publicId,
      status: order.status,
      total: Number(order.total),
      currency: order.currency,
      customerName: order.customerName,
      createdAt: order.createdAt,
      items: order.items.map((item) => ({
        productName: item.product?.title ?? 'Unknown',
        quantity: item.quantity,
        price: Number(item.price),
      })),
    };
  }

  async submitContact(
    tenantId: string,
    data: {
      name: string;
      phone: string;
      message: string;
      type?: 'contact' | 'repair';
      email?: string;
      deviceType?: string;
      issueSummary?: string;
      customerId?: string;
      attachmentUrls?: { url: string; mimeType: string }[];
    },
  ) {
    const { name, phone, message, type = 'contact', email, deviceType, issueSummary, customerId, attachmentUrls } = data;
    if (!name?.trim() || !phone?.trim() || !message?.trim()) {
      throw new Error('Name, phone, and message are required');
    }
    const ticket = await this.prisma.contactMessage.create({
      data: {
        tenantId,
        customerId: customerId || null,
        type,
        status: 'new',
        name: name.trim(),
        phone: phone.trim(),
        message: message.trim(),
        email: email?.trim() || undefined,
        deviceType: deviceType?.trim() || undefined,
        issueSummary: issueSummary?.trim() || undefined,
      },
    });
    if (attachmentUrls?.length) {
      await this.prisma.ticketAttachment.createMany({
        data: attachmentUrls.map((a) => ({
          contactMessageId: ticket.id,
          url: a.url,
          mimeType: a.mimeType,
        })),
      });
    }
    return ticket;
  }

  async getMyTickets(customerId: string) {
    return this.prisma.contactMessage.findMany({
      where: { type: 'repair', customerId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        deviceType: true,
        issueSummary: true,
        message: true,
        name: true,
        phone: true,
        createdAt: true,
      },
    });
  }

  async getTicket(customerId: string, ticketId: string) {
    const ticket = await this.prisma.contactMessage.findFirst({
      where: { id: ticketId, type: 'repair', customerId },
      include: {
        ticketMessages: { orderBy: { createdAt: 'asc' } },
        ticketAttachments: true,
      },
    });
    return ticket;
  }

  async addTicketMessage(customerId: string, ticketId: string, body: string) {
    const ticket = await this.prisma.contactMessage.findFirst({
      where: { id: ticketId, type: 'repair', customerId },
    });
    if (!ticket) return null;
    return this.prisma.ticketMessage.create({
      data: {
        contactMessageId: ticketId,
        senderType: 'customer',
        customerId,
        body: body.trim(),
      },
    });
  }
}
