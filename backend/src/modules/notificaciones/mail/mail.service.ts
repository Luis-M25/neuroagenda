import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import { ConfigService } from '../../../common/config.service';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;
  private readonly maxRetries: number;
  private readonly retryIntervalMs: number;
  readonly minutesBefore: number;

  constructor(private configService: ConfigService) {
    this.maxRetries = this.configService.notifications.email.maxRetries;
    this.retryIntervalMs = this.configService.notifications.email.retryIntervalMs;
    this.minutesBefore = this.configService.notifications.reminder.minutesBefore;
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_PORT === '465',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    }
  }

  async sendMail(to: string, subject: string, html: string) {
    if (!this.transporter) {
      this.logger.log(`[EMAIL SIMULADO] Para: ${to} Asunto: ${subject}`);
      return { simulated: true, to, subject };
    }

    let lastError: Error | null = null;
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await this.transporter.sendMail({
          from: `"Agendamiento Medico" <${process.env.SMTP_USER}>`,
          to,
          subject,
          html,
        });
      } catch (error) {
        lastError = error;
        this.logger.warn(`Email attempt ${attempt + 1}/${this.maxRetries + 1} failed`);
        if (attempt < this.maxRetries) {
          await new Promise((r) => setTimeout(r, this.retryIntervalMs));
        }
      }
    }
    this.logger.error('Email all attempts failed', lastError);
    throw lastError;
  }

  async notificarEspecialista5min(data: {
    to: string;
    pacienteNombre: string;
    hora: string;
    lugar: string;
  }) {
    const html = `
      <h2>Cita proxima</h2>
      <p>Paciente: <strong>${data.pacienteNombre}</strong></p>
      <p>Hora: <strong>${data.hora}</strong></p>
      <p>Lugar: <strong>${data.lugar}</strong></p>
      <p>Su cita comienza en ${this.minutesBefore} minutos.</p>
    `;

    return this.sendMail(data.to, `Su cita es en ${this.minutesBefore} minutos`, html);
  }

  async notificarAdminInasistencia(data: {
    to: string;
    paciente: string;
    especialidad: string;
    contador: number;
    severidad: string;
    pacienteId: string;
  }) {
    const colores: Record<string, string> = { BAJA: '🟢', MEDIA: '🟡', ALTA: '🟠', CRITICA: '🔴' };
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';

    const html = `
      <h2>${colores[data.severidad] || '🔴'} Alerta de Inasistencia</h2>
      <p>Paciente: <strong>${data.paciente}</strong></p>
      <p>Especialidad: <strong>${data.especialidad}</strong></p>
      <p>Total inasistencias: <strong>${data.contador}</strong></p>
      <p>Severidad: <strong>${data.severidad}</strong></p>
      <br/>
      <a href="${frontendUrl}/admin/pacientes/${data.pacienteId}">Ver detalle del paciente</a>
    `;

    return this.sendMail(data.to, `${colores[data.severidad]} [${data.severidad}] Inasistencia: ${data.paciente} - ${data.especialidad}`, html);
  }
}
