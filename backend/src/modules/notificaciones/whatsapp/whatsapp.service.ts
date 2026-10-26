import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '../../../common/config.service';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);
  private readonly maxRetries: number;
  private readonly retryIntervalMs: number;
  private readonly apiUrl = `https://graph.facebook.com/${process.env.WHATSAPP_API_VERSION || 'v22.0'}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
  ) {
    this.maxRetries = this.configService.notifications.whatsapp.maxRetries;
    this.retryIntervalMs = this.configService.notifications.whatsapp.retryIntervalMs;
  }

  async sendTemplate(to: string, templateName: string, params: Record<string, string>) {
    if (!process.env.WHATSAPP_ACCESS_TOKEN) {
      this.logger.log(`[WHATSAPP SIMULADO] template: ${templateName} to: ${to}`);
      return { simulated: true, to, templateName, params };
    }

    const body = {
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: {
        name: templateName,
        language: { code: 'es' },
        components: [{
          type: 'body',
          parameters: Object.entries(params).map(([_, value]) => ({
            type: 'text',
            text: value,
          })),
        }],
      },
    };

    let lastError: Error | null = null;
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await this.httpService.axiosRef.post(this.apiUrl, body, {
          headers: {
            Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
          },
        });
        return response.data;
      } catch (error) {
        lastError = error;
        this.logger.warn(`WhatsApp attempt ${attempt + 1}/${this.maxRetries + 1} failed`);
        if (attempt < this.maxRetries) {
          await new Promise((r) => setTimeout(r, this.retryIntervalMs));
        }
      }
    }
    this.logger.error('WhatsApp all attempts failed', lastError);
    throw lastError;
  }

  async enviarConfirmacionCita(pacienteTelefono: string, data: {
    paciente: string;
    especialista: string;
    especialidad: string;
    fecha: string;
    hora: string;
    lugar: string;
  }) {
    return this.sendTemplate(pacienteTelefono, 'cita_confirmacion', {
      paciente: data.paciente,
      especialista: data.especialista,
      especialidad: data.especialidad,
      fecha: data.fecha,
      hora: data.hora,
      lugar: data.lugar,
    });
  }

  async notificarInasistencia(adminTelefono: string, data: {
    paciente: string;
    especialidad: string;
    contador: number;
    severidad: string;
  }) {
    return this.sendTemplate(adminTelefono, 'notificacion_inasistencia', {
      paciente: data.paciente,
      especialidad: data.especialidad,
      contador: data.contador.toString(),
      severidad: data.severidad,
    });
  }
}
