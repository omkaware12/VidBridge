const nodemailer = require("nodemailer");

  const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: "vidbridge18@gmail.com",
    pass: "pwzr jxhs hffz nrol",
  },
});


const sendemail = async()=>{
    try{
            const info = await transporter.sendMail({
            from: '"VidBridge" <vidbridge7@gmail.com>',
            to: "okaware7@gmail.com",
            subject: "Hello ✔",
            text: "Hello world?", // plain‑text body
            html: "<b>Hello world?</b>", // HTML body
            });
            console.log(info);
    }catch(err){
       console.log(err);
    }
};


// sendemail();
module.exports = transporter;

