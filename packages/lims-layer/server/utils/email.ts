import nodemailer from 'nodemailer'

function getSmtpConfig() {
  const config = useRuntimeConfig()
  return {
    host: config.smtpHost as string,
    port: Number(config.smtpPort) || 587,
    user: config.smtpUser as string,
    pass: config.smtpPass as string,
    from: (config.smtpFrom as string) || 'noreply@bbi-lab.org',
  }
}

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  const smtp = getSmtpConfig()

  if (!smtp.host) {
    const message = 'SMTP host is not configured. Set NUXT_SMTP_HOST in environment variables.'
    if (process.env.NODE_ENV === 'production') {
      throw new Error(message)
    }
    console.warn(`[email] ${message}`)
    console.info(`[email] DEV: Password reset URL for ${to}: ${resetUrl}`)
    return
  }

  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.port === 465,
    auth: smtp.user ? { user: smtp.user, pass: smtp.pass } : undefined,
  })

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Password Reset Request</h2>
      <p>You requested a password reset for your BBI LIMS account.</p>
      <p>Click the button below to set a new password. This link expires in <strong>1 hour</strong>.</p>
      <p style="margin: 24px 0;">
        <a href="${resetUrl}"
           style="background-color: #3B82F6; color: white; padding: 12px 24px;
                  text-decoration: none; border-radius: 6px; display: inline-block;">
          Reset Password
        </a>
      </p>
      <p>Or copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #6B7280;">${resetUrl}</p>
      <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0;" />
      <p style="color: #6B7280; font-size: 14px;">
        If you did not request a password reset, you can safely ignore this email.
        Your password will not be changed.
      </p>
    </div>
  `

  const textBody = [
    'Password Reset Request',
    '',
    'You requested a password reset for your BBI LIMS account.',
    'Click the link below to set a new password. This link expires in 1 hour.',
    '',
    resetUrl,
    '',
    'If you did not request a password reset, you can safely ignore this email.',
  ].join('\n')

  await transporter.sendMail({
    from: smtp.from,
    to,
    subject: 'BBI LIMS — Password Reset',
    text: textBody,
    html: htmlBody,
  })
}
