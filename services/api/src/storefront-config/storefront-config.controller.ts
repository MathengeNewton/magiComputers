import { Body, Controller, Get, Put, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../tenant/tenant.guard';
import { StorefrontConfigService } from './storefront-config.service';

@Controller('storefront-config')
@UseGuards(JwtAuthGuard, TenantGuard)
export class StorefrontConfigController {
  constructor(private readonly service: StorefrontConfigService) {}

  @Get()
  async get(@Request() req) {
    return this.service.getByTenant(req.user.tenantId);
  }

  @Put()
  async upsert(
    @Request() req,
    @Body()
    body: {
      heroEyebrow?: string;
      heroTitle?: string;
      heroDescription?: string;
      heroImageMediaId?: string | null;
      primaryButtonLabel?: string;
      primaryButtonHref?: string;
      secondaryButtonLabel?: string;
      secondaryButtonHref?: string;
    },
  ) {
    return this.service.upsertByTenant(req.user.tenantId, body);
  }
}
