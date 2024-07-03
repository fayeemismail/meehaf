const otp = require('../models/otpModel');
const nodemailer = require('nodemailer');
const otp_Generator = require('otp-generator');


const send_mail = (email, otp) =>{
    const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true, 
        auth: {
          user: "fayeemwayne@gmail.com",
          pass: "ccyttfulxvmzxstl",
        }
      });
      const mailOptions = {
        from:'fayeemwayne@gmail.com',
        to: email,
        subject:`this is your otp for M E E ' H A F otp verification We Welcomes you With Pure Joy And Surprises`,
        text:`Here is your OTP ${otp}`,
        html:`Oh you here here's the otp ${otp}`
      }; 
      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error)
        }else{
            console.log(`Mail has been sent to ${info.response}`)
        }
      })
};


function sendOtp (email){
    const otp = otp_Generator.generate(4, { upperCaseAlphabets:false, specialChars:false, digits:true, lowerCaseAlphabets:false });

    send_mail(email,otp)
    return otp
}



const resendOtp = async (req, res) => {
  try {
    // CHECKING IF THERE IS ANY USER IN THE SESSION 
    if (!req.session || !req.session.email) {
      return res.render('otp', { message: "Unauthorized: No session found" });
    }
    
    const email = req.session.email;

    // CHECKING IF THE OTP EXISTS IN THE DATABASE
    const existingOtp = await otp.findOne({ email: email });

    // IF IT EXISTS, DELETE THE DOCUMENT
    if (existingOtp) {
      await otp.deleteOne({ email: email });;
      console.log('deleteing the otopppppppppppppp')
    }

    // GENERATING A NEW OTP
    const newOtp = Math.floor(1000 + Math.random() * 9000).toString(); 

    // CREATING A NEW INSTANCE OF THE USER DOCUMENT
    const otpDocument = new otp({
      email: email,
      otp: newOtp,
      createdAt: new Date() 
    });

    // SAVING THE DOCUMENT INSTANCE
    const saving = await otpDocument.save();
    if (saving) {
      console.log('OTP saved successfully');

      // SET TIMEOUT TO DELETE DATA AFTER 120 SEC
      setTimeout(async () => {
        await otp.deleteOne({ email: email });
        console.log('OTP deleted after 120 seconds');
      }, 120000); // 120 seconds

      // SENDING THE NEW OTP TO THE USER'S EMAIL
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'fayeemwayne@gmail.com',
          pass: 'ccyttfulxvmzxstl'
        }
      });

      const mailOptions = {
        from: 'fayeemwayne@gmail.com',
        to: email,
        subject: 'Your OTP Code',
        text: `Your OTP code is ${newOtp}. It is valid for 2 minutes.`
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log(error);
          return res.status(500).render('otp', { message: "Error sending OTP" });
        } else {
          console.log('Email sent: ' + info.response);
          res.render('otp', { message: "OTP resent successfully" });
        }
      });
    } else {
      res.status(500).render('otp', { message: "Error saving OTP" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).render('otp', { message: "Internal server error" });
  }
};



const fpResendOtp = async (req,res) => {

  try {
    const email = req.session.email

    if(!email){
      res.render('fpOtp', {message: 'User Not Found In The session'})
    }

    const existingOtp = await otp.findOne({email:email});

    if(existingOtp){
      await otp.deleteOne({email:email})
    }

    const newOtp = Math.floor(1000 + Math.random() * 9000).toString(); 

    const otpDocument = new otp({
      email:email,
      otp:newOtp,
      createdAt:new Date()
    });
    const saving = await otpDocument.save();
    if(saving){
      console.log('otp saved in 140');

      //DELETE THE OTP 
      setTimeout( async () => {
        await otp.deleteOne({email: email});
        console.log('otp delete in 120 sec')
      },120000);


      // SENDING THE NEW OTP TO THE USER'S EMAIL
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'fayeemwayne@gmail.com',
          pass: 'ccyttfulxvmzxstl'
        }
      });

      const mailOptions = {
        from: 'fayeemwayne@gmail.com',
        to: email,
        subject: 'Your OTP Code',
        text: `Your OTP code is ${newOtp}. It is valid for 2 minutes.`
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log(error);
          return res.status(500).render('fpOTP', { message: "Error sending OTP" });
        } else {
          console.log('Email sent: ' + info.response);
          res.render('fpOTP', { message: "OTP resent successfully" });
        }
      });
    } else {
      res.status(500).render('fpOTP', { message: "Error saving OTP" });
    }
  } catch (error) {
    console.log(error)
  }

}







module.exports = {
    sendOtp,
    resendOtp,
    fpResendOtp
}
  