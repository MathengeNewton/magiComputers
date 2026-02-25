import { Controller, Get, Post, Put, Delete, Body, Param, Query, BadRequestException, UseGuards, Request, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StoreService } from './store.service';
import { StoreAuthService } from './store-auth.service';
import { CartService } from '../cart/cart.service';
import { OrdersService } from '../orders/orders.service';
import { MediaService } from '../media/media.service';
import { CustomerJwtGuard } from '../auth/guards/customer-jwt.guard';
import { createOrderSchema } from '@magicomputers/shared';

@Controller('store')
export class StoreController {
  constructor(
    private storeService: StoreService,
    private storeAuthService: StoreAuthService,
    private cartService: CartService,
    private ordersService: OrdersService,
    private mediaService: MediaService,
  ) {}

  @Get('categories')
  async getCategories(
    @Query('tenantId') tenantId?: string,
    @Query('withProductCount') withProductCount?: string,
  ) {
    return this.storeService.getCategories(tenantId, withProductCount === 'true');
  }

  @Get('products')
  async getProducts(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: string,
    @Query('categorySlug') categorySlug?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('supplierId') supplierId?: string,
    @Query('tenantId') tenantId?: string,
  ) {
    return this.storeService.getProducts({
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      search,
      categoryId,
      categorySlug,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      supplierId,
      tenantId,
    });
  }

  @Get('products/:slug')
  async getProduct(@Param('slug') slug: string, @Query('tenantId') tenantId?: string) {
    return this.storeService.getProduct(slug, tenantId);
  }

  @Get('orders/:publicId')
  async getOrderByPublicId(@Param('publicId') publicId: string) {
    return this.storeService.getOrderByPublicId(publicId);
  }

  // Cart (public, tenant-scoped)
  @Get('cart')
  async getCart(
    @Query('tenantId') tenantId: string,
    @Query('cartToken') cartToken: string,
  ) {
    if (!tenantId || !cartToken) {
      throw new BadRequestException('tenantId and cartToken required');
    }
    return this.cartService.getOrCreateCart(tenantId, cartToken);
  }

  @Post('cart/add')
  async addToCart(
    @Body() body: { tenantId: string; cartToken: string; productId: string; quantity: number; variantId?: string },
  ) {
    const { tenantId, cartToken, productId, quantity, variantId } = body;
    if (!tenantId || !cartToken || !productId || !quantity) {
      throw new BadRequestException('tenantId, cartToken, productId, quantity required');
    }
    return this.cartService.addToCart(tenantId, cartToken, productId, quantity, variantId);
  }

  @Put('cart/update')
  async updateCartItem(
    @Body() body: { tenantId: string; cartToken: string; itemId: string; quantity: number },
  ) {
    const { tenantId, cartToken, itemId, quantity } = body;
    if (!tenantId || !cartToken || !itemId) {
      throw new BadRequestException('tenantId, cartToken, itemId required');
    }
    return this.cartService.updateItem(tenantId, cartToken, itemId, quantity ?? 1);
  }

  @Delete('cart/remove')
  async removeFromCart(
    @Query('tenantId') tenantId: string,
    @Query('cartToken') cartToken: string,
    @Query('itemId') itemId: string,
  ) {
    if (!tenantId || !cartToken || !itemId) {
      throw new BadRequestException('tenantId, cartToken, itemId required');
    }
    return this.cartService.removeItem(tenantId, cartToken, itemId);
  }

  @Post('register')
  async register(
    @Body() body: { tenantId: string; email: string; password: string; name: string; phone?: string },
  ) {
    const { tenantId, email, password, name, phone } = body;
    if (!tenantId || !email || !password || !name) {
      throw new BadRequestException('tenantId, email, password, and name required');
    }
    return this.storeAuthService.register(tenantId, { email, password, name, phone });
  }

  @Post('login')
  async login(@Body() body: { tenantId: string; email: string; password: string }) {
    const { tenantId, email, password } = body;
    if (!tenantId || !email || !password) {
      throw new BadRequestException('tenantId, email, and password required');
    }
    return this.storeAuthService.login(tenantId, email, password);
  }

  @Post('refresh')
  async refresh(@Body() body: { refreshToken: string; customerId: string }) {
    const { refreshToken, customerId } = body;
    if (!refreshToken || !customerId) throw new BadRequestException('refreshToken and customerId required');
    return this.storeAuthService.refresh(customerId, refreshToken);
  }

  @UseGuards(CustomerJwtGuard)
  @Post('logout')
  async logout(@Request() req: { user: { id: string } }) {
    return this.storeAuthService.logout(req.user.id);
  }

  @UseGuards(CustomerJwtGuard)
  @Get('me')
  async getMe(@Request() req: { user: { id: string } }) {
    const profile = await this.storeAuthService.getProfile(req.user.id);
    if (!profile) throw new BadRequestException('Customer not found');
    return profile;
  }

  @Post('forgot-password')
  async forgotPassword(@Body() body: { tenantId: string; email: string }) {
    const { tenantId, email } = body;
    if (!tenantId || !email) throw new BadRequestException('tenantId and email required');
    return this.storeAuthService.forgotPassword(tenantId, email);
  }

  @Post('reset-password')
  async resetPassword(@Body() body: { token: string; newPassword: string }) {
    const { token, newPassword } = body;
    if (!token || !newPassword) throw new BadRequestException('token and newPassword required');
    return this.storeAuthService.resetPassword(token, newPassword);
  }

  @Post('contact')
  async submitContact(
    @Body()
    body: {
      tenantId: string;
      name: string;
      phone: string;
      message: string;
      type?: 'contact' | 'repair';
      email?: string;
      deviceType?: string;
      issueSummary?: string;
    },
  ) {
    const { tenantId, name, phone, message, type, email, deviceType, issueSummary } = body;
    if (!tenantId || !name || !phone || !message) {
      throw new BadRequestException('tenantId, name, phone, and message required');
    }
    return this.storeService.submitContact(tenantId, {
      name,
      phone,
      message,
      type,
      email,
      deviceType,
      issueSummary,
    });
  }

  @Post('repair')
  async submitRepair(
    @Body()
    body: {
      tenantId: string;
      name: string;
      phone: string;
      message: string;
      email?: string;
      deviceType?: string;
      issueSummary?: string;
      attachmentUrls?: { url: string; mimeType: string }[];
    },
  ) {
    const { tenantId, name, phone, message, email, deviceType, issueSummary, attachmentUrls } = body;
    if (!tenantId || !name || !phone || !message) {
      throw new BadRequestException('tenantId, name, phone, and message required');
    }
    return this.storeService.submitContact(tenantId, {
      name,
      phone,
      message,
      type: 'repair',
      email,
      deviceType,
      issueSummary,
      attachmentUrls,
    });
  }

  @UseGuards(CustomerJwtGuard)
  @Post('me/repair/upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadRepairFile(
    @Request() req: { user: { tenantId: string } },
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file?.buffer) throw new BadRequestException('No file uploaded');
    return this.mediaService.uploadFile(
      req.user.tenantId,
      file.buffer,
      file.mimetype,
      file.size,
      file.originalname,
    );
  }

  @UseGuards(CustomerJwtGuard)
  @Post('me/repair')
  async createRepairTicket(
    @Request() req: { user: { id: string; name: string; phone: string | null; email: string; tenantId: string } },
    @Body()
    body: {
      deviceType?: string;
      issueSummary?: string;
      message: string;
      phone?: string;
      attachmentUrls?: { url: string; mimeType: string }[];
    },
  ) {
    const { message, deviceType, issueSummary, phone: bodyPhone, attachmentUrls } = body;
    if (!message?.trim()) throw new BadRequestException('message required');
    const customer = req.user;
    const phone = (bodyPhone?.trim() || customer.phone || '').trim();
    if (!phone) throw new BadRequestException('phone required');
    return this.storeService.submitContact(customer.tenantId, {
      name: customer.name,
      phone,
      message: message.trim(),
      type: 'repair',
      email: customer.email,
      deviceType: deviceType?.trim(),
      issueSummary: issueSummary?.trim(),
      customerId: customer.id,
      attachmentUrls,
    });
  }

  @UseGuards(CustomerJwtGuard)
  @Get('me/tickets')
  async getMyTickets(@Request() req: { user: { id: string } }) {
    return this.storeService.getMyTickets(req.user.id);
  }

  @UseGuards(CustomerJwtGuard)
  @Get('me/tickets/:id')
  async getTicket(@Request() req: { user: { id: string } }, @Param('id') id: string) {
    const ticket = await this.storeService.getTicket(req.user.id, id);
    if (!ticket) throw new BadRequestException('Ticket not found');
    return ticket;
  }

  @UseGuards(CustomerJwtGuard)
  @Post('me/tickets/:id/messages')
  async addTicketMessage(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
    @Body() body: { body: string },
  ) {
    if (!body.body?.trim()) throw new BadRequestException('body required');
    const msg = await this.storeService.addTicketMessage(req.user.id, id, body.body);
    if (!msg) throw new BadRequestException('Ticket not found');
    return msg;
  }

  @Post('orders')
  async createOrder(@Body() body: any) {
    const { tenantId, ...rest } = body;
    if (!tenantId) throw new BadRequestException('tenantId required');
    const order = await this.ordersService.create(tenantId, rest);
    // Clear cart after order
    const cartToken = body.cartToken;
    if (cartToken) {
      await this.cartService.clearCart(tenantId, cartToken);
    }
    return {
      publicId: order.publicId,
      status: order.status,
      total: Number(order.total),
      currency: order.currency,
      customerName: order.customerName,
      createdAt: order.createdAt,
      items: order.items.map((i) => ({
        productName: i.product?.title,
        quantity: i.quantity,
        price: Number(i.price),
      })),
    };
  }
}
