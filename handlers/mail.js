const nodemailer = require('nodemailer');
const pug = require('pug');
const juice = require('juice');
const htmlToText = require('html-to-text');
const promisify = require('es6-promisify');

const transport = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
    }
});

exports.send = async (options) => {
    const html = generateHTML(options.filename, options);
    const text = htmlToText.fromString(html);
    const mailOptions = {
       from: 'Nagiatzi <nagiatzi@gmail.com>',
       to: options.user.email,
       subject: options.subject,
       html,
       text: 'this also' 
    };
    const sendMail = promisify(transport.sendMail, transport);
    return sendMail(mailOptions);
};

const generateHTML = (filename, options = {}) => {
    const html = pug.renderFile(`${__dirname}/../views/email/${filename}.pug`,
 options);
 const inlined = juice(html);
 return inlined;
};
/*
transport.sendMail({
    from: 'Nagiatzi <nagiatzi@gmail.com>',
    to: 'nagiatzi@gmail.com',
    subject: 'just trying things out!',
    html: 'Hey i love ya',
    text: 'Hey I Love yaaya'
});*/ 

