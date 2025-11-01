import nodemailer from 'nodemailer'

const sendEmail = async ({ email, subject, message }) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // App password from Gmail
    },
  })

  const mailOptions = {
    from: `ChatApp Support <${process.env.EMAIL_USER}>`,
    to: email,
    subject,
    text: message,
  }

  await transporter.sendMail(mailOptions)
}

export default sendEmail
