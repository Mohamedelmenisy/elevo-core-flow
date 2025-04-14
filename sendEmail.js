const nodemailer = require('nodemailer');
// Setup the transporter for sending emails via SMTP
const transporter = nodemailer.createTransport({
  service: 'gmail', // Use the service you want like Gmail or your provider's SMTP
  auth: {
    user: 'your-email@gmail.com',  // Your email address
    pass: 'your-email-password'    // Your password (you can use an app password if Gmail)
  }
});
// Setup the email
const mailOptions = {
  from: 'your-email@gmail.com',
  to: 'recipient@example.com',
  subject: 'Subject Here',
  text: 'This is the body of the email.'
};
// Send the email
transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    console.log('Error occurred:', error);
  } else {
    console.log('Email sent: ' + info.response);
  }
});