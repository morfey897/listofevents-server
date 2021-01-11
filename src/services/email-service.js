const nodemailer = require("nodemailer");

const TRANSPORTERS = {
  no_reply: {
    email: process.env.SMTP_AUTH_NO_REPLY.split(":")[0],
    transport: nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_AUTH_NO_REPLY.split(":")[0],
        pass: process.env.SMTP_AUTH_NO_REPLY.split(":")[1]
      }
    })
  },

  admin: {
    email: process.env.SMTP_AUTH_ADMIN.split(":")[0],
    transport: nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_AUTH_ADMIN.split(":")[0],
        pass: process.env.SMTP_AUTH_ADMIN.split(":")[1]
      }
    })
  },
};

/*
* sender - no_reply|admin
*/
async function sendEmail({ from, to, subject, text, html }, sender) {
  const data = TRANSPORTERS[sender];
  if (!data) return;

  let info = await data.transport.sendMail({
    from: from ? `"${from}" <${data.email}>` : data.email, // sender address
    to: Array.isArray(to) ? to.join(", ") : to, // list of receivers
    subject: subject, // Subject line
    text: text, // plain text body
    html: html, // html body
  });
  return info.messageId;
}

module.exports = {
  sendEmail
}