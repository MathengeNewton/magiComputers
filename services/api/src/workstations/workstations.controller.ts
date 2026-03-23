import { Body, Controller, Delete, Get, Param, Post, Put, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../tenant/tenant.guard';
import { WorkstationsService } from './workstations.service';

@Controller('workstations')
@UseGuards(JwtAuthGuard, TenantGuard)
export class WorkstationsController {
  constructor(private readonly workstationsService: WorkstationsService) {}

  @Get()
  async findAll(@Request() req) {
    return this.workstationsService.findAll(req.user.tenantId);
  }

  @Get(':id')
  async findOne(@Request() req, @Param('id') id: string) {
    return this.workstationsService.findOne(req.user.tenantId, id);
  }

  @Post()
  async create(
    @Request() req,
    @Body()
    body: {
      title: string;
      slug: string;
      summary?: string;
      description?: string;
      coverMediaId?: string | null;
      status?: 'draft' | 'published';
      sortOrder?: number;
      products?: Array<{ productId: string; order?: number; isPrimary?: boolean }>;
    },
  ) {
    return this.workstationsService.create(req.user.tenantId, body);
  }

  @Put(':id')
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body()
    body: {
      title?: string;
      slug?: string;
      summary?: string;
      description?: string;
      coverMediaId?: string | null;
      status?: 'draft' | 'published';
      sortOrder?: number;
      products?: Array<{ productId: string; order?: number; isPrimary?: boolean }>;
    },
  ) {
    return this.workstationsService.update(req.user.tenantId, id, body);
  }

  @Delete(':id')
  async remove(@Request() req, @Param('id') id: string) {
    return this.workstationsService.remove(req.user.tenantId, id);
  }
}
