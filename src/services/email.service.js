require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    type: 'OAuth2',
    user: process.env.EMAIL_USER,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    refreshToken: process.env.REFRESH_TOKEN,
  },
});

// Verify the connection configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('Error connecting to email server:', error);
  } else {
    console.log('Email server is ready to send messages');
  }
});


// Function to send email
const sendEmail = async (to, subject, text, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"Backend Ledger" <${process.env.EMAIL_USER}>`, // sender address
      to, // list of receivers
      subject, // Subject line
      text, // plain text body
      html, // html body
    });

    console.log('Message sent: %s', info.messageId);
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

async function sendRegisterEmail(userEmail, name){
    const subject = "Welcome to Backend Ledger! – Let's Get Started!"
    const text = `Hi ${name},\n\nWelcome to Backend Ledger!\nWe're excited to have you on board!Your account has been successfully created, and you're now ready to explore everything Backend Ledger has to offer.\n\nBest regards,\nThe Backend Ledger Team`
    const html = `<p>Hi ${name},</p><br><p>Welcome to Backend Ledger!</p><p>We're excited to have you on board!<p>Your account has been successfully created, and you're now ready to explore everything Backend Ledger has to offer.<br><p>Best regards,</p><br><p>The Backend Ledger Team</p>`

    await sendEmail(userEmail,subject,text,html)
}

async function sendTransactionEmail(userEmail,name,amount,toAccount){
    const subject = "Transaction Successful!"
    const text = `Hi ${name},\n\nYour transaction has been completed successfully.\n\nAmount: ${amount}\nTo account: ${toAccount}\n\nIf you did not make this transaction, please contact our support team.\n\nBest regards,\nThe Backend Ledger Team`
    const html = `<p>Hi ${name},</p><p>Your transaction has been completed successfully.</p><p><strong>Amount:</strong> ${amount}<br><strong>To account:</strong> ${toAccount}</p><p>If you did not make this transaction, please contact our support team.</p><p>Best regards,<br>The Backend Ledger Team</p>`

    await sendEmail(userEmail, subject, text, html)
}

async function sendTransactionFailureEmail(userEmail,name,amount,toAccount){
    const subject = "Transaction Failed!"
    const text = `Hi ${name},\n\nWe regret to inform you that your transaction of\n\nAmount: ${amount}\nTo: ${toAccount} was failed.\n\nNo money was deducted, for further queries please contact our support team.\n\nBest regards,\nThe Backend Ledger Team`
    const html = `<p>Hi ${name},</p><p>We regret to inform you that your transaction of</p><p><strong>Amount:</strong> ${amount}<br><strong>To:</strong> ${toAccount} was failed.</p><p>No money was deducted,for further queries please contact our support team.</p><p>Best regards,<br>The Backend Ledger Team</p>`

    await sendEmail(userEmail, subject, text, html)
}

module.exports = {sendRegisterEmail, sendTransactionEmail, sendTransactionFailureEmail};