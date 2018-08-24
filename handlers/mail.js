const nodemailer = require("nodemailer");
const pug = require('pug');
const juice = require('juice');
const htmlToText = require('html-to-text');
const promisify = require('es6-promisify');
var postmark = require("postmark");

var client = new postmark.Client(process.env.MAIL_CLIENT);

const transport = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS
    }
});

const generateHTML = (file, options = {}) => {
    const html = pug.renderFile(`${__dirname}/../views/emails/${file}.pug`, options);
    const inlined = juice(html);
    return inlined;
}

// client.sendEmail({

//   }).then(res => {
//       console.log(res)
//   }).catch(err => { console.log(err)}) 

exports.send = async (options) => {
    const html = generateHTML(options.filename, options);
    const text = htmlToText.fromString(html);
    const mailOptions = {
        from: `TX Food Fight <txfoodfight@camerontharp.com>`,
        to: options.user.email,
        subject: options.subject,
        HtmlBody: html,
        TextBody: text
    };
    // const sendMail = promisify(transport.sendMail, transport);
    return client.sendEmail(mailOptions);
}