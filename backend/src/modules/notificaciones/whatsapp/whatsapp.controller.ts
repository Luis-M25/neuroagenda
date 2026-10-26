import { Controller, Get, Post, Body, Query, HttpCode, Logger, Req, ForbiddenException, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { createHmac, timingSafeEqual } from 'crypto';
import { WhatsappService } from './whatsapp.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';

function verifyMetaSignature(
  rawBody: string | Buffer,
  signatureHeader: string | undefined,
  appSecret: string,
): boolean {
  if (!signatureHeader) return false;
  const expected = 'sha256=' + createHmac('sha256', appSecret).update(rawBody).digest('hex');
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(signatureHeader));
  } catch {
    return false;
  }
}

@Controller('whatsapp')
export class WhatsappController {
  private readonly logger = new Logger(WhatsappController.name);

  constructor(private whatsappService: WhatsappService) {}

  @Get('webhook')
  verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
  ) {
    if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
      return challenge;
    }
    return 'Verification failed';
  }

  @Post('webhook')
  @HttpCode(200)
  receiveMessage(@Req() req: Request) {
    const signature = req.headers['x-hub-signature-256'] as string | undefined;

    if (process.env.NODE_ENV === 'production') {
      if (!signature) {
        this.logger.error('WhatsApp webhook recibido sin firma x-hub-signature-256');
        throw new ForbiddenException('Firma ausente');
      }
      const appSecret = process.env.WHATSAPP_APP_SECRET;
      if (appSecret) {
        const rawBody = (req as any).rawBody || JSON.stringify(req.body);
        const valid = verifyMetaSignature(rawBody, signature, appSecret);
        if (!valid) {
          this.logger.error('Firma de webhook WhatsApp invalida');
          throw new ForbiddenException('Firma invalida');
        }
      }
    }

    const safeLog = {
      object: (req.body as any)?.object,
      entryCount: (req.body as any)?.entry?.length || 0,
      hasMessages: !!(req.body as any)?.entry?.[0]?.changes?.[0]?.value?.messages,
    };
    this.logger.log('WhatsApp webhook received', safeLog);

    if (process.env.NODE_ENV === 'development') {
      this.logger.debug('WhatsApp webhook full body', req.body);
    }

    return { status: 'ok' };
  }

  @Post('test')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMISION_PRINCIPAL')
  testWhatsApp(@Body() dto: { to: string; template: string; params: Record<string, string> }) {
    return this.whatsappService.sendTemplate(dto.to, dto.template, dto.params);
  }
}
