-- AlterTable
ALTER TABLE "products"
ADD COLUMN "featured_order" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "is_featured_home" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "workstations" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "summary" TEXT,
    "description" TEXT,
    "cover_media_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workstations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workstation_products" (
    "id" TEXT NOT NULL,
    "workstation_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workstation_products_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "workstations_tenant_id_status_sort_order_idx" ON "workstations"("tenant_id", "status", "sort_order");
CREATE INDEX "workstations_cover_media_id_idx" ON "workstations"("cover_media_id");
CREATE UNIQUE INDEX "workstations_tenant_id_slug_key" ON "workstations"("tenant_id", "slug");
CREATE INDEX "workstation_products_workstation_id_order_idx" ON "workstation_products"("workstation_id", "order");
CREATE INDEX "workstation_products_product_id_idx" ON "workstation_products"("product_id");
CREATE UNIQUE INDEX "workstation_products_workstation_id_product_id_key" ON "workstation_products"("workstation_id", "product_id");

-- AddForeignKey
ALTER TABLE "workstations"
ADD CONSTRAINT "workstations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "workstations"
ADD CONSTRAINT "workstations_cover_media_id_fkey" FOREIGN KEY ("cover_media_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "workstation_products"
ADD CONSTRAINT "workstation_products_workstation_id_fkey" FOREIGN KEY ("workstation_id") REFERENCES "workstations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "workstation_products"
ADD CONSTRAINT "workstation_products_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
