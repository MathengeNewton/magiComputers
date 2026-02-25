import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create tenant
  const tenant = await prisma.tenant.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Demo Tenant',
    },
  });

  // Create admin user (admin@magicomputers.co.ke / admin123)
  const passwordHash = await bcrypt.hash('admin123', 10);
  const existingAdmin = await prisma.user.findFirst({
    where: { email: { in: ['admin@magicomputers.co.ke', 'admin@demo.com'] }, tenantId: tenant.id },
  });
  const adminUser = existingAdmin
    ? await prisma.user.update({
        where: { id: existingAdmin.id },
        data: { email: 'admin@magicomputers.co.ke', passwordHash, name: 'Admin', role: 'admin' },
      })
    : await prisma.user.create({
        data: {
          tenantId: tenant.id,
          email: 'admin@magicomputers.co.ke',
          passwordHash,
          name: 'Admin',
          role: 'admin',
        },
      });

  // Create staff user (limited access: posts, products, orders)
  const staffPasswordHash = await bcrypt.hash('staff123', 10);
  const staffUser = await prisma.user.upsert({
    where: { email: 'staff@demo.com' },
    update: { role: 'staff' },
    create: {
      tenantId: tenant.id,
      email: 'staff@demo.com',
      passwordHash: staffPasswordHash,
      name: 'Staff User',
      role: 'staff',
    },
  });
  // Create demo categories
  const catVehicles = await prisma.productCategory.upsert({
    where: {
      tenantId_slug: { tenantId: tenant.id, slug: 'vehicles' },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'Vehicles',
      slug: 'vehicles',
      order: 0,
    },
  });
  const catBikes = await prisma.productCategory.upsert({
    where: {
      tenantId_slug: { tenantId: tenant.id, slug: 'bikes' },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'Bikes',
      slug: 'bikes',
      order: 1,
    },
  });
  const catApparel = await prisma.productCategory.upsert({
    where: {
      tenantId_slug: { tenantId: tenant.id, slug: 'apparel' },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'Apparel',
      slug: 'apparel',
      order: 2,
    },
  });

  // Create demo supplier (required for products)
  const supplier = await prisma.supplier.upsert({
    where: { id: '00000000-0000-0000-0000-000000000004' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000004',
      tenantId: tenant.id,
      name: 'Demo Supplier',
      email: 'supplier@demo.com',
    },
  });

  // Create or update demo products (idempotent)
  const product1 = await prisma.product.upsert({
    where: {
      tenantId_slug: { tenantId: tenant.id, slug: 'demo-t-shirt' },
    },
    update: {
      title: 'Demo T-Shirt',
      description: 'A cool demo t-shirt for testing the platform',
      price: 29.99,
      supplyPrice: 15,
      minSellPrice: 25,
      listPrice: 29.99,
      status: 'published',
    },
    create: {
      tenantId: tenant.id,
      supplierId: supplier.id,
      categoryId: catApparel.id,
      title: 'Demo T-Shirt',
      description: 'A cool demo t-shirt for testing the platform',
      price: 29.99,
      currency: 'KES',
      supplyPrice: 15,
      minSellPrice: 25,
      listPrice: 29.99,
      slug: 'demo-t-shirt',
      status: 'published',
      variants: {
        create: [
          { sku: 'TSHIRT-SM-BLUE', name: 'Size: Small, Color: Blue', stock: 10 },
          { sku: 'TSHIRT-MD-BLUE', name: 'Size: Medium, Color: Blue', stock: 15 },
          { sku: 'TSHIRT-LG-BLUE', name: 'Size: Large, Color: Blue', stock: 8 },
        ],
      },
    },
  });

  const product2 = await prisma.product.upsert({
    where: {
      tenantId_slug: { tenantId: tenant.id, slug: 'demo-hoodie' },
    },
    update: {
      title: 'Demo Hoodie',
      description: 'A warm demo hoodie perfect for any occasion',
      price: 59.99,
      supplyPrice: 30,
      minSellPrice: 50,
      listPrice: 59.99,
      status: 'published',
    },
    create: {
      tenantId: tenant.id,
      supplierId: supplier.id,
      categoryId: catApparel.id,
      title: 'Demo Hoodie',
      description: 'A warm demo hoodie perfect for any occasion',
      price: 59.99,
      currency: 'KES',
      supplyPrice: 30,
      minSellPrice: 50,
      listPrice: 59.99,
      slug: 'demo-hoodie',
      status: 'published',
      variants: {
        create: [
          { sku: 'HOODIE-MD-BLACK', name: 'Size: Medium, Color: Black', stock: 5 },
          { sku: 'HOODIE-LG-BLACK', name: 'Size: Large, Color: Black', stock: 7 },
        ],
      },
    },
  });

  // Create demo draft post only if none exists (idempotent)
  let draftPost = await prisma.post.findFirst({
    where: { tenantId: tenant.id, status: 'draft' },
    orderBy: { createdAt: 'desc' },
  });
  if (!draftPost) {
    draftPost = await prisma.post.create({
    data: {
      tenantId: tenant.id,
      status: 'draft',
      captions: {
        create: [
          {
            platform: 'facebook' as const,
            caption: 'Check out our amazing new products! 🎉',
            includeLink: true,
          },
          {
            platform: 'instagram' as const,
            caption: 'New collection just dropped! ✨ Check the link in bio',
            includeLink: true,
          },
          {
            platform: 'tiktok',
            caption: 'New products available now! 🛍️',
            includeLink: true,
          },
        ],
      },
      products: {
        create: [
          {
            productId: product1.id,
            isPrimary: true,
          },
          {
            productId: product2.id,
            isPrimary: false,
          },
        ],
      },
    },
    });
  }

  console.log('Seed data created:');
  console.log(`- Tenant: ${tenant.name} (${tenant.id})`);
  console.log(`- Admin User: ${adminUser.email} (${adminUser.id})`);
  console.log(`- Staff User: ${staffUser.email} (${staffUser.id})`);

  console.log(`- Products: ${product1.title}, ${product2.title}`);
  console.log(`- Draft Post: ${draftPost.id}`);
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
