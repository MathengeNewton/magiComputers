import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type StorefrontConfigInput = {
  heroEyebrow?: string;
  heroTitle?: string;
  heroDescription?: string;
  heroImageMediaId?: string | null;
  primaryButtonLabel?: string;
  primaryButtonHref?: string;
  secondaryButtonLabel?: string;
  secondaryButtonHref?: string;
};

@Injectable()
export class StorefrontConfigService {
  constructor(private readonly prisma: PrismaService) {}

  async getByTenant(tenantId: string) {
    const config = await this.prisma.storefrontConfig.findUnique({
      where: { tenantId },
      include: { heroImageMedia: { select: { id: true, url: true } } },
    });

    if (!config) {
      return {
        heroEyebrow: 'MagiComputers',
        heroTitle: 'Electronics and repairs done right.',
        heroDescription:
          'From custom workstation builds to day-to-day devices, we supply quality gear and dependable repair support for homes and offices.',
        heroImageMediaId: null,
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
      heroImageMediaId: config.heroImageMediaId,
      heroImageUrl: config.heroImageMedia?.url ?? null,
      primaryButtonLabel: config.primaryButtonLabel,
      primaryButtonHref: config.primaryButtonHref,
      secondaryButtonLabel: config.secondaryButtonLabel,
      secondaryButtonHref: config.secondaryButtonHref,
    };
  }

  async upsertByTenant(tenantId: string, input: StorefrontConfigInput) {
    const config = await this.prisma.storefrontConfig.upsert({
      where: { tenantId },
      create: {
        tenantId,
        heroEyebrow: input.heroEyebrow?.trim() || 'MagiComputers',
        heroTitle: input.heroTitle?.trim() || 'Electronics and repairs done right.',
        heroDescription:
          input.heroDescription?.trim() ||
          'From custom workstation builds to day-to-day devices, we supply quality gear and dependable repair support for homes and offices.',
        heroImageMediaId: input.heroImageMediaId || null,
        primaryButtonLabel: input.primaryButtonLabel?.trim() || 'Shop now',
        primaryButtonHref: input.primaryButtonHref?.trim() || '/shop',
        secondaryButtonLabel: input.secondaryButtonLabel?.trim() || 'Book repair',
        secondaryButtonHref: input.secondaryButtonHref?.trim() || '/repair',
      },
      update: {
        ...(input.heroEyebrow !== undefined ? { heroEyebrow: input.heroEyebrow.trim() || 'MagiComputers' } : {}),
        ...(input.heroTitle !== undefined ? { heroTitle: input.heroTitle.trim() || 'Electronics and repairs done right.' } : {}),
        ...(input.heroDescription !== undefined
          ? {
              heroDescription:
                input.heroDescription.trim() ||
                'From custom workstation builds to day-to-day devices, we supply quality gear and dependable repair support for homes and offices.',
            }
          : {}),
        ...(input.heroImageMediaId !== undefined ? { heroImageMediaId: input.heroImageMediaId || null } : {}),
        ...(input.primaryButtonLabel !== undefined ? { primaryButtonLabel: input.primaryButtonLabel.trim() || 'Shop now' } : {}),
        ...(input.primaryButtonHref !== undefined ? { primaryButtonHref: input.primaryButtonHref.trim() || '/shop' } : {}),
        ...(input.secondaryButtonLabel !== undefined
          ? { secondaryButtonLabel: input.secondaryButtonLabel.trim() || 'Book repair' }
          : {}),
        ...(input.secondaryButtonHref !== undefined
          ? { secondaryButtonHref: input.secondaryButtonHref.trim() || '/repair' }
          : {}),
      },
      include: { heroImageMedia: { select: { id: true, url: true } } },
    });

    return {
      heroEyebrow: config.heroEyebrow,
      heroTitle: config.heroTitle,
      heroDescription: config.heroDescription,
      heroImageMediaId: config.heroImageMediaId,
      heroImageUrl: config.heroImageMedia?.url ?? null,
      primaryButtonLabel: config.primaryButtonLabel,
      primaryButtonHref: config.primaryButtonHref,
      secondaryButtonLabel: config.secondaryButtonLabel,
      secondaryButtonHref: config.secondaryButtonHref,
    };
  }
}
