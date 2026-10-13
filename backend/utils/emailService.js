const nodemailer = require('nodemailer');

/**
 * Configure Nodemailer transporter based on environment variables
 */
const getTransporter = () => {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  if (!emailUser || !emailPass || emailUser === 'your_email@gmail.com') {
    return null; // Not configured yet, will fall back to simulated mode
  }

  // If custom SMTP host is provided
  if (process.env.EMAIL_HOST) {
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT) || 587,
      secure: Number(process.env.EMAIL_PORT) === 465,
      auth: {
        user: emailUser,
        pass: emailPass
      }
    });
  }

  // Standard Gmail Service
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: emailUser,
      pass: emailPass
    }
  });
};

/**
 * Send an OTP Email to a recipient
 * @param {string} toEmail - Recipient email address
 * @param {string} otp - 6-digit numeric OTP code
 * @param {string} purpose - 'ACCOUNT_REGISTRATION' | 'LAND_ASSIGNMENT'
 * @param {object} extraDetails - Additional info like citizen name or land dag
 */
const sendOtpEmail = async (toEmail, otp, purpose, extraDetails = {}) => {
  const isRegistration = purpose === 'ACCOUNT_REGISTRATION';
  const title = isRegistration
    ? 'e-ভূমি নাগরিক অ্যাকাউন্ট ভেরিফিকেশন কোড'
    : 'e-ভূমি জমি হস্তান্তর ও সাব-রেজিস্ট্রি সম্মতি ওটিপি';

  const subtitle = isRegistration
    ? 'আপনার নাগরিক অ্যাকাউন্ট সক্রিয় করতে নিচের ওটিপি কোডটি ব্যবহার করুন।'
    : `সাব-রেজিস্ট্রি অফিস থেকে জমি বরাদ্দ আবেদন (দাগ নং: ${extraDetails.dag_no || 'N/A'}, মৌজা: ${extraDetails.mouza || 'N/A'}) যাচাইয়ের জন্য আপনার সম্মতি কোড।`;

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="bn">
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f1f5f9; margin: 0; padding: 20px; }
        .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
        .header { background: linear-gradient(135deg, #064e3b, #059669); color: #ffffff; padding: 30px 24px; text-align: center; }
        .header h1 { margin: 0; font-size: 22px; font-weight: 700; letter-spacing: 0.5px; }
        .header p { margin: 6px 0 0; font-size: 13px; opacity: 0.9; }
        .body { padding: 32px 28px; color: #334155; }
        .otp-box { background: #f8fafc; border: 2px dashed #10b981; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }
        .otp-code { font-size: 38px; font-weight: 800; color: #047857; letter-spacing: 8px; font-family: monospace; }
        .notice { font-size: 13px; color: #64748b; line-height: 1.6; }
        .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 18px 24px; text-align: center; font-size: 12px; color: #94a3b8; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏛️ গণপ্রজাতন্ত্রী বাংলাদেশ সরকার</h1>
          <p>ভূমি মন্ত্রণালয় · e-ভূমি ডিজিটাল ভূমি ব্যবস্থাপনা প্ল্যাটফর্ম</p>
        </div>
        <div class="body">
          <h2 style="color: #0f172a; font-size: 18px; margin-top: 0;">${title}</h2>
          <p style="font-size: 14px; line-height: 1.6; color: #475569;">
            ${extraDetails.citizen_name ? `প্রিয় <strong>${extraDetails.citizen_name}</strong>,<br/>` : ''}
            ${subtitle}
          </p>

          <div class="otp-box">
            <div style="font-size: 12px; color: #059669; font-weight: 600; text-transform: uppercase; margin-bottom: 6px;">আপনার ওটিপি (OTP) ভেরিফিকেশন কোড</div>
            <div class="otp-code">${otp}</div>
            <div style="font-size: 12px; color: #64748b; margin-top: 6px;">মেয়াদ: পরবর্তী ১০ মিনিট</div>
          </div>

          <p class="notice">
            🔒 <strong>সতর্কতা:</strong> এই কোডটি গোপনীয়। এটি কারো সাথে শেয়ার করবেন না। ভূমি মন্ত্রণালয় বা কোনো কর্মকর্তা কখনই আপনার ওটিপি জানতে চাইবেন না।
          </p>
        </div>
        <div class="footer">
          এটি একটি স্বয়ংক্রিয় বার্তা। অনুগ্রহ করে এই ইমেইলে উত্তর দেবেন না।<br/>
          © ২০২৬ e-ভূমি · সর্বস্বত্ব সংরক্ষিত
        </div>
      </div>
    </body>
    </html>
  `;

  const transporter = getTransporter();

  if (!transporter) {
    console.log('\n======================================================');
    console.log(`📧 [EMAIL SIMULATION MODE - SMTP NOT CONFIGURED IN .ENV]`);
    console.log(`📨 To: ${toEmail}`);
    console.log(`🎯 Purpose: ${purpose}`);
    console.log(`🔑 OTP Code: ${otp}`);
    console.log('======================================================\n');
    return {
      success: true,
      simulated: true,
      message: 'SMTP কনফিগার না থাকায় ওটিপি কনসোলে লগ করা হয়েছে।'
    };
  }

  try {
    const fromAddress = process.env.EMAIL_FROM || `"e-ভূমি বাংলাদেশ" <${process.env.EMAIL_USER}>`;
    const info = await transporter.sendMail({
      from: fromAddress,
      to: toEmail,
      subject: `[e-ভূমি] ${title} - ${otp}`,
      html: htmlContent
    });

    console.log(`✅ [EMAIL SENT] MessageId: ${info.messageId} to ${toEmail}`);
    return {
      success: true,
      simulated: false,
      messageId: info.messageId
    };
  } catch (error) {
    console.error('❌ [EMAIL SEND ERROR]:', error.message);
    // Return error details with console fallback so testing can proceed
    return {
      success: false,
      error: error.message,
      fallbackOtp: otp
    };
  }
};

module.exports = {
  sendOtpEmail
};
