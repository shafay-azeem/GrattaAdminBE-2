const nodeMailer = require("nodemailer");

const sendMail = async (options) => {
  const transporter = nodeMailer.createTransport({
    host: process.env.SMPT_HOST,
    port: process.env.SMPT_PORT,
    secure:false,
    auth: {
      user: process.env.SMPT_MAIL,
      pass: process.env.SMPT_PASSWORD,
    },
  });

  const mailOptions = {
    from: "hello@grattia.com",
    to: options.email,
    subject: options.subject,
    text: options.message,
  };

  let info=await transporter.sendMail(mailOptions);
  // console.log(info,"==")
};

module.exports = sendMail;
