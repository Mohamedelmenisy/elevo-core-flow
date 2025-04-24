const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { email, name } = req.body;

    const msg = {
      to: email,
      from: 'M.elsayed@thechefz.co',
      subject: 'Please confirm your email',
      html: `
        <h1>Hello, ${name}!</h1>
        <p>Thank you for signing up. Please click the link below to confirm your email address:</p>
        <a href="https://mohamedelmenisy.github.io/my-training-course/confirm.html?email=${email}">Confirm Email</a>
      `,
    };

    try {
      await sgMail.send(msg);
      res.status(200).json({ message: 'Confirmation email sent' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error sending email' });
    }
  } else {
    // Handle incorrect request method (if not POST)
    res.status(405).json({ error: 'Method Not Allowed' });
  }
}
