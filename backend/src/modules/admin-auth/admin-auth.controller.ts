import { Body, Controller, Get, HttpCode, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { AdminAuthGuard, type AdminRequest } from './admin-auth.guard';
import { AdminAuthService } from './admin-auth.service';
import { clearAuthCookies, REFRESH_COOKIE, setAuthCookies } from './cookies';
import { normalisePermissions } from '../admin-users/permission-catalogue';
import { type AdminProfile } from './admin-auth.service';
import { LoginDto } from './dto/login.dto';

/**
 * What the panel needs about whoever is signed in: their details and the
 * modules they may open. The Super Admin reaches everything.
 */
const session = (admin: AdminProfile) => ({
  ...admin,
  isSuperAdmin: admin.role.isSystem,
  permissions: normalisePermissions(admin.permissions),
});

const clientInfo = (request: Request) => ({
  ip: request.ip,
  userAgent: request.headers['user-agent'],
});

@Controller('admin/auth')
export class AdminAuthController {
  constructor(private readonly auth: AdminAuthService) {}

  @Post('login')
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async login(
    @Body() dto: LoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { admin, tokens } = await this.auth.login(dto.email, dto.password, clientInfo(request));
    setAuthCookies(response, tokens);
    return { admin: session(admin), accessTokenExpiresAt: tokens.accessExpiresAt };
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    try {
      const tokens = await this.auth.refresh(request.cookies?.[REFRESH_COOKIE], clientInfo(request));
      setAuthCookies(response, tokens);
      return { accessTokenExpiresAt: tokens.accessExpiresAt };
    } catch (error) {
      clearAuthCookies(response);
      throw error;
    }
  }

  @Post('logout')
  @HttpCode(200)
  async logout(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    await this.auth.logout(request.cookies?.[REFRESH_COOKIE]);
    clearAuthCookies(response);
    return { success: true };
  }

  @Get('me')
  @UseGuards(AdminAuthGuard)
  me(@Req() request: AdminRequest) {
    return { admin: session(request.admin) };
  }
}
