import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

let transporter = null;

function createTransporter() {
  if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });
  }

  // Development fallback: log emails to console
  return {
    sendMail: async (mailOptions) => {
      console.log('📧 [DEV EMAIL] ==============================');
      console.log('To:', mailOptions.to);
      console.log('Subject:', mailOptions.subject);
      console.log('Text:', mailOptions.text);
      console.log('HTML:', mailOptions.html);
      console.log('===============================================');
      return { messageId: `dev-${Date.now()}` };
    },
  };
}

export async function getTransporter() {
  if (!transporter) {
    transporter = createTransporter();
  }
  return transporter;
}

export async function sendEmail({ to, subject, text, html }) {
  const transport = await getTransporter();
  return transport.sendMail({
    from: env.SMTP_FROM,
    to,
    subject,
    text,
    html,
  });
}

export async function sendVerificationEmail(email, code) {
  return sendEmail({
    to: email,
    subject: 'Verifique seu e-mail - ConectaFácil',
    text: `Seu código de verificação é: ${code}. Válido por 10 minutos.`,
    html: `
      <h2>Verificação de E-mail</h2>
      <p>Seu código de verificação é: <strong>${code}</strong></p>
      <p>Este código expira em 10 minutos.</p>
    `,
  });
}

export async function sendPasswordResetEmail(email, code) {
  return sendEmail({
    to: email,
    subject: 'Recuperação de senha - ConectaFácil',
    text: `Seu código para redefinir a senha é: ${code}. Válido por 10 minutos.`,
    html: `
      <h2>Recuperação de Senha</h2>
      <p>Seu código para redefinir a senha é: <strong>${code}</strong></p>
      <p>Este código expira em 10 minutos.</p>
    `,
  });
}

export async function sendApplicationNotificationEmail(recruiterEmail, candidateName, vacancyTitle) {
  return sendEmail({
    to: recruiterEmail,
    subject: `Nova candidatura: ${vacancyTitle} - ConectaFácil`,
    text: `O candidato ${candidateName} se candidatou à vaga "${vacancyTitle}".`,
    html: `
      <h2>Nova Candidatura</h2>
      <p>O candidato <strong>${candidateName}</strong> se candidatou à vaga <strong>"${vacancyTitle}"</strong>.</p>
      <p>Acesse o painel do recrutador para ver os detalhes.</p>
    `,
  });
}

export async function sendApplicationStatusEmail(candidateEmail, vacancyTitle, status) {
  const statusText = status === 'ACCEPTED' ? 'aceita' : 'rejeitada';
  return sendEmail({
    to: candidateEmail,
    subject: `Sua candidatura foi ${statusText} - ConectaFácil`,
    text: `Sua candidatura para a vaga "${vacancyTitle}" foi ${statusText}.`,
    html: `
      <h2>Atualização de Candidatura</h2>
      <p>Sua candidatura para a vaga <strong>"${vacancyTitle}"</strong> foi <strong>${statusText}</strong>.</p>
    `,
  });
}

export async function sendVacancyUpdateEmail(candidateEmail, vacancyTitle) {
  return sendEmail({
    to: candidateEmail,
    subject: `Vaga atualizada: ${vacancyTitle} - ConectaFácil`,
    text: `A vaga "${vacancyTitle}" foi atualizada.`,
    html: `
      <h2>Vaga Atualizada</h2>
      <p>A vaga <strong>"${vacancyTitle}"</strong> foi atualizada.</p>
      <p>Acesse o portal para ver as alterações.</p>
    `,
  });
}