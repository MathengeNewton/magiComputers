import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IntegrationsService } from '../integrations/integrations.service';

@Injectable()
export class DestinationsService {
  constructor(
    private prisma: PrismaService,
    private integrationsService: IntegrationsService,
  ) {}

  async findAll(tenantId: string) {
    return this.prisma.destination.findMany({
      where: {
        integration: {
          tenantId,
        },
      },
      include: {
        integration: {
          select: {
            id: true,
            provider: true,
            tenantId: true,
          },
        },
      },
    });
  }

  async refresh(tenantId: string, integrationId: string) {
    const integration = await this.prisma.integration.findFirst({
      where: {
        id: integrationId,
        tenantId,
      },
    });

    if (!integration) {
      throw new Error('Integration not found');
    }

    const decryptedToken = this.integrationsService.decryptToken(integration.accessToken);
    return this.integrationsService.refreshDestinations(
      integrationId,
      integration.provider,
      decryptedToken,
    );
  }
}
