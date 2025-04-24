// استيراد مكتبة SendGrid
const sgMail = require('@sendgrid/mail');

// تأكد من أنك قد قمت بتعيين مفتاح API لـ SendGrid في Vercel
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// معالجة طلبات API
export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { name, email } = req.body;

    // إعداد رسالة البريد الإلكتروني
    const msg = {
      to: email,
      from: 'M.elsayed@thehefz.co',  // استبدل هذا بالبريد الذي تريد الإرسال منه
      subject: 'Confirm your email address',
      text: `Hello ${name},\n\nPlease confirm your email address by clicking the link below:\n\nhttps://your-deployed-app-url.com/confirm.html?email=${email}`,
      html: `<p>Hello ${name},</p><p>Please confirm your email address by clicking the link below:</p><a href="https://your-deployed-app-url.com/confirm.html?email=${email}">Confirm Email</a>`,
    };

    try {
      // إرسال البريد الإلكتروني
      await sgMail.send(msg);
      res.status(200).json({ message: 'Confirmation email sent successfully!' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to send confirmation email.' });
    }
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
}
