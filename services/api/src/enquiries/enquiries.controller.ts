import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { EnquiriesService } from './enquiries.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../tenant/tenant.guard';

@Controller('enquiries')
@UseGuards(JwtAuthGuard, TenantGuard)
export class EnquiriesController {
  constructor(private enquiriesService: EnquiriesService) {}

  @Get()
  async findAll(
    @Request() req: { user: { tenantId: string } },
    @Query('type') type?: 'contact' | 'repair',
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.enquiriesService.findAll(req.user.tenantId, {
      type,
      status,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get(':id')
  async findOne(
    @Request() req: { user: { tenantId: string } },
    @Param('id') id: string,
  ) {
    return this.enquiriesService.findOne(req.user.tenantId, id);
  }

  @Patch(':id')
  async update(
    @Request() req: { user: { tenantId: string } },
    @Param('id') id: string,
    @Body() body: { status?: string; internalNote?: string },
  ) {
    return this.enquiriesService.update(req.user.tenantId, id, body);
  }

  @Post(':id/reply')
  async reply(
    @Request() req: { user: { tenantId: string; id: string } },
    @Param('id') id: string,
    @Body() body: { body: string },
  ) {
    if (!body.body?.trim()) throw new BadRequestException('body required');
    return this.enquiriesService.addReply(req.user.tenantId, id, req.user.id, body.body);
  }
}
