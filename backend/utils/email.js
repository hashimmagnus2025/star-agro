import nodemailer from 'nodemailer';

const transportConfig = {
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  requireTLS: true,
  tls: {
    rejectUnauthorized: false,
  },
};

if (process.env.SMTP_SERVICE) {
  transportConfig.service = process.env.SMTP_SERVICE;
} else {
  transportConfig.host = process.env.SMTP_HOST;
  transportConfig.port = Number(process.env.SMTP_PORT) || 587;
  transportConfig.secure = process.env.SMTP_SECURE === 'true';
}

const transporter = nodemailer.createTransport(transportConfig);

export const sendEmail = async ({ to, subject, text, html }) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error('SMTP is not configured. Please set SMTP_USER and SMTP_PASS in .env');
  }

  await transporter.verify();

  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    text,
    html,
  };

  return transporter.sendMail(mailOptions);
};

export const sendResetPasswordEmail = async ({ email, resetUrl }) => {
  return sendEmail({
    to: email,
    subject: 'Star Agro Password Reset',
    text: `You requested a password reset. Use the link below to set a new password:\n\n${resetUrl}\n\nIf you did not request this, please ignore this message.`,
    html: `
      <p>Hi,</p>
      <p>You requested a password reset for your Star Agro account.</p>
      <p><a href="${resetUrl}" target="_blank" rel="noopener noreferrer">Click here to reset your password</a></p>
      <p>If the link does not work, paste this into your browser:</p>
      <p>${resetUrl}</p>
      <p>If you did not request this change, please ignore this email.</p>
    `,
  });
};
