// File: api/send-confirmation.js

// Import the SendGrid Mail library
const sgMail = require('@sendgrid/mail');

// Set the API key from Environment Variables (NEVER hardcode it here)
// You MUST set SENDGRID_API_KEY in your Vercel project settings
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Define the handler function for Vercel
module.exports = async (req, res) => {
    // 1. Check if the request method is POST
    if (req.method !== 'POST') {
        console.log(`Method Not Allowed: ${req.method}`);
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
    }

    // 2. Get the email address from the request body
    const { email } = req.body;

    // 3. Basic validation
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        console.log(`Invalid email received: ${email}`);
        return res.status(400).json({ message: 'Valid email address is required' });
    }

    // 4. Define Sender Email (Verified in SendGrid)
    const fromEmail = 'M.elsayed@thechefz.co';

    // 5. Define Confirmation Link URL
    // IMPORTANT: Replace 'https://your-deployed-app-url.com' with the *actual* URL
    // where your confirm.html page will be hosted after deployment.
    const confirmationBaseUrl = 'https://mohamedelmenisy.github.io/my-training-course/confirm.html'; // <-- !!! REPLACE !!!
    const confirmationLink = `${confirmationBaseUrl}?email=${encodeURIComponent(email)}`;

    // 6. Construct the SendGrid message object
    const msg = {
        to: email, // Recipient email from the request
        from: {
           email: fromEmail,
           name: 'Coaching & Leadership Team' // Optional: Sender name
        },
        subject: 'Confirm Your Account - Coaching & Leadership',
        text: `Hello,\n\nPlease confirm your email address for the Coaching & Leadership course by clicking this link: ${confirmationLink}\n\nIf you did not sign up, please ignore this email.\n\nBest regards,\nThe Coaching & Leadership Team`,
        html: `
            <html>
                <body>
                    <h2>Welcome to Coaching & Leadership!</h2>
                    <p>Hello,</p>
                    <p>Thank you for signing up. Please confirm your email address by clicking the button below:</p>
                    <p style="margin: 25px 0;">
                        <a href="${confirmationLink}" style="background-color: #3498db; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; display: inline-block; font-family: sans-serif; font-size: 16px;">Confirm Email Address</a>
                    </p>
                    <p>If the button doesn't work, copy and paste this link into your browser:</p>
                    <p><a href="${confirmationLink}">${confirmationLink}</a></p>
                    <p>If you did not sign up for this account, you can safely ignore this email.</p>
                    <br>
                    <p>Best regards,</p>
                    <p><strong>The Coaching & Leadership Team</strong></p>
                </body>
            </html>
        `,
    };

    // 7. Try sending the email
    try {
        console.log(`Attempting to send confirmation email to: ${email} via SendGrid...`);
        await sgMail.send(msg);
        console.log(`SendGrid email sent successfully to: ${email}`);
        // Send a success response back to the signup.html page
        return res.status(200).json({ message: 'Confirmation email sent successfully' });
    } catch (error) {
        console.error('Error sending SendGrid email:');
        // Log the detailed error from SendGrid if available
        if (error.response) {
            console.error(error.response.body);
        } else {
            console.error(error);
        }
        // Send an error response back to the signup.html page
        return res.status(500).json({ message: 'Failed to send confirmation email' });
    }
};
