// api/send-confirmation.js

import sgMail from '@sendgrid/mail'

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { name, email } = req.body

  const msg = {
    to: email,
    from: 'M.elsayed@thechefz.co',
    subject: 'Confirm your email for My Training Course',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2>Welcome to My Training Course, ${name} 👋</h2>
        <p>Thanks for signing up! We're excited to have you onboard.</p>
        <p>Please confirm your email address by clicking the button below:</p>
        <p style="text-align: center; margin: 30px 0;">
          <a href="https://my-training-course.vercel.app/confirm?email=${encodeURIComponent(email)}"
             style="padding: 12px 24px; background-color: #0070f3; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Confirm Email
          </a>
        </p>
        <p>If you didn't request this email, you can safely ignore it.</p>
        <br>
        <p>Thanks,<br>The My Training Course Team</p>
      </div>
    `
  }

  try {
    await sgMail.send(msg)
    res.status(200).json({ message: 'Email sent successfully' })
  } catch (error) {
    console.error('SendGrid error:', error)
    res.status(500).json({ message: 'Failed to send email' })
  }
}
