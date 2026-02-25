import {
  Controller,
  Post,
  Body,
  Get,
  Patch,
  UseGuards,
  Request,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { refreshTokenSchema } from '@magicomputers/shared';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req) {
    // LocalAuthGuard already validates the user and attaches it to req.user
    // The guard will throw UnauthorizedException with "Invalid email or password" if validation fails
    return this.authService.login(req.user);
  }

  @Post('refresh')
  async refresh(@Body() body: { refreshToken: string }) {
    const validated = refreshTokenSchema.parse(body);
    return this.authService.refreshToken(validated.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Request() req) {
    await this.authService.logout(req.user.id);
    return { message: 'Logged out successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@Request() req) {
    const profile = await this.authService.getProfile(req.user.id);
    if (!profile) throw new UnauthorizedException('User not found');
    return profile;
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  async updateMe(
    @Request() req,
    @Body()
    body: {
      name?: string;
      currentPassword?: string;
      newPassword?: string;
    },
  ) {
    return this.authService.updateMe(req.user.id, body);
  }
}
