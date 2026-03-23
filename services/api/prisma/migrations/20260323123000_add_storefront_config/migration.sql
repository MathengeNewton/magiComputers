-- CreateTable
CREATE TABLE "storefront_configs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "hero_eyebrow" TEXT NOT NULL DEFAULT 'MagiComputers',
    "hero_title" TEXT NOT NULL DEFAULT 'Electronics and repairs done right.',
    "hero_description" TEXT NOT NULL DEFAULT 'From custom workstation builds to day-to-day devices, we supply quality gear and dependable repair support for homes and offices.',
    "hero_image_media_id" TEXT,
    "primary_button_label" TEXT NOT NULL DEFAULT 'Shop now',
    "primary_button_href" TEXT NOT NULL DEFAULT '/shop',
    "secondary_button_label" TEXT NOT NULL DEFAULT 'Book repair',
    "secondary_button_href" TEXT NOT NULL DEFAULT '/repair',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "storefront_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "storefront_configs_tenant_id_key" ON "storefront_configs"("tenant_id");
CREATE INDEX "storefront_configs_hero_image_media_id_idx" ON "storefront_configs"("hero_image_media_id");

-- AddForeignKey
ALTER TABLE "storefront_configs"
ADD CONSTRAINT "storefront_configs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "storefront_configs"
ADD CONSTRAINT "storefront_configs_hero_image_media_id_fkey" FOREIGN KEY ("hero_image_media_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE;
