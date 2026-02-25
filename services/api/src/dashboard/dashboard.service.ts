import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats(tenantId: string) {
    const [
      products,
      orders,
      posts,
      integrations,
      totalSales,
      publishedPosts,
      pendingOrders,
      completeOrders,
      tiktokPosts,
      facebookPosts,
      instagramPosts,
      twitterPosts,
    ] = await Promise.all([
      this.prisma.product.count({ where: { tenantId } }),
      this.prisma.order.count({ where: { tenantId } }),
      this.prisma.post.count({ where: { tenantId } }),
      this.prisma.integration.count({ where: { tenantId } }),
      // Total sales from completed orders
      this.prisma.order.aggregate({
        where: {
          tenantId,
          status: 'complete',
        },
        _sum: {
          total: true,
        },
      }),
      // Published posts count
      this.prisma.post.count({
        where: {
          tenantId,
          status: 'published',
        },
      }),
      // Pending orders count
      this.prisma.order.count({
        where: {
          tenantId,
          status: 'pending',
        },
      }),
      // Complete orders count
      this.prisma.order.count({
        where: {
          tenantId,
          status: 'complete',
        },
      }),
      // Platform-specific post counts (published destinations)
      this.prisma.postDestination.count({
        where: {
          post: { tenantId },
          status: 'published',
          destination: {
            type: 'tiktok_account',
            integration: { tenantId },
          },
        },
      }),
      this.prisma.postDestination.count({
        where: {
          post: { tenantId },
          status: 'published',
          destination: {
            type: 'facebook_page',
            integration: { tenantId },
          },
        },
      }),
      this.prisma.postDestination.count({
        where: {
          post: { tenantId },
          status: 'published',
          destination: {
            type: 'instagram_business',
            integration: { tenantId },
          },
        },
      }),
      this.prisma.postDestination.count({
        where: {
          post: { tenantId },
          status: 'published',
          destination: {
            type: 'twitter_account',
            integration: { tenantId },
          },
        },
      }),
    ]);

    return {
      products,
      orders,
      posts,
      integrations,
      totalSales: totalSales._sum.total ? Number(totalSales._sum.total) : 0,
      publishedPosts,
      pendingOrders,
      completeOrders,
      tiktokPosts,
      facebookPosts,
      instagramPosts,
      twitterPosts,
    };
  }

  async getActivity(tenantId: string, limit = 15) {
    const [recentPosts, recentOrders] = await Promise.all([
      this.prisma.post.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: { id: true, status: true, createdAt: true },
      }),
      this.prisma.order.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: { id: true, publicId: true, customerName: true, createdAt: true },
      }),
    ]);

    const items: Array<{
      type: 'post' | 'order';
      id: string;
      label: string;
      createdAt: Date;
    }> = [
      ...recentPosts.map((p) => ({
        type: 'post' as const,
        id: p.id,
        label: `Post ${p.status}`,
        createdAt: p.createdAt,
      })),
      ...recentOrders.map((o) => ({
        type: 'order' as const,
        id: o.id,
        label: `Order #${o.publicId} (${o.customerName})`,
        createdAt: o.createdAt,
      })),
    ];

    items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return items.slice(0, limit);
  }
}
