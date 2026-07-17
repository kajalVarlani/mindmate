import nodemailer from "nodemailer";

const createTransporter = () =>
  nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

/* ── Signup verification OTP ── */
export const sendOTP = async (email, otp) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your MindMate Verification Code",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <h2 style="color: #6860E6; text-align: center;">MindMate Signup Verification</h2>
          <p style="font-size: 16px; color: #333;">Hello,</p>
          <p style="font-size: 16px; color: #333;">Thank you for starting your journey with MindMate. Please use the following One-Time Password (OTP) to complete your signup. This code is valid for <strong>5 minutes</strong>.</p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="font-size: 32px; font-weight: bold; background-color: #f4f4f4; padding: 10px 20px; border-radius: 5px; color: #333; letter-spacing: 5px;">${otp}</span>
          </div>
          <p style="font-size: 14px; color: #777;">If you did not request this code, please ignore this email.</p>
          <hr style="border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #aaa; text-align: center;">MindMate &copy; ${new Date().getFullYear()}</p>
        </div>
      `,
    };

    const info = await createTransporter().sendMail(mailOptions);
    console.log("Signup OTP sent:", info.response);
    return true;
  } catch (error) {
    console.error("Error sending signup OTP:", error);
    return false;
  }
};

/* ── Password reset OTP ── */
export const sendPasswordResetOTP = async (email, otp) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "MindMate — Password Reset Code",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <h2 style="color: #6860E6; text-align: center;">Password Reset Request</h2>
          <p style="font-size: 16px; color: #333;">Hello,</p>
          <p style="font-size: 16px; color: #333;">We received a request to reset your MindMate password. Use the code below. It expires in <strong>10 minutes</strong>.</p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="font-size: 32px; font-weight: bold; background-color: #f4f4f4; padding: 10px 20px; border-radius: 5px; color: #333; letter-spacing: 5px;">${otp}</span>
          </div>
          <p style="font-size: 14px; color: #777;">If you did not request a password reset, you can safely ignore this email. Your password will not be changed.</p>
          <hr style="border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #aaa; text-align: center;">MindMate &copy; ${new Date().getFullYear()}</p>
        </div>
      `,
    };

    const info = await createTransporter().sendMail(mailOptions);
    console.log("Password reset OTP sent:", info.response);
    return true;
  } catch (error) {
    console.error("Error sending reset OTP:", error);
    return false;
  }
};

/* ── Therapist Onboarding ── */
export const sendTherapistOnboardingEmail = async (email, name) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "MindMate — Therapist Application Received",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <h2 style="color: #6860E6; text-align: center;">Application Under Review</h2>
          <p style="font-size: 16px; color: #333;">Dear Dr. ${name},</p>
          <p style="font-size: 16px; color: #333;">Thank you for applying to join MindMate as a therapist.</p>
          <p style="font-size: 16px; color: #333;">Our team is reviewing your credentials. We will notify you once your application has been verified.</p>
          <hr style="border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #aaa; text-align: center;">MindMate &copy; ${new Date().getFullYear()}</p>
        </div>
      `,
    };
    await createTransporter().sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Error sending onboarding email:", error);
    return false;
  }
};

/* ── Therapist Approval ── */
export const sendTherapistApprovalEmail = async (email, name) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "MindMate — Application Approved!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <h2 style="color: #4CAF50; text-align: center;">Application Approved!</h2>
          <p style="font-size: 16px; color: #333;">Dear Dr. ${name},</p>
          <p style="font-size: 16px; color: #333;">Congratulations! Your application has been approved. You can now log into your dashboard to set up your weekly schedule, pricing, and bank details.</p>
          <hr style="border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #aaa; text-align: center;">MindMate &copy; ${new Date().getFullYear()}</p>
        </div>
      `,
    };
    await createTransporter().sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Error sending approval email:", error);
    return false;
  }
};

/* ── Therapist Rejection ── */
export const sendTherapistRejectionEmail = async (email, name, reason) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "MindMate — Application Status",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <h2 style="color: #ef4444; text-align: center;">Application Declined</h2>
          <p style="font-size: 16px; color: #333;">Dear Dr. ${name},</p>
          <p style="font-size: 16px; color: #333;">Thank you for your interest in MindMate. Unfortunately, your application has been declined for the following reason:</p>
          <blockquote style="background: #f9f9f9; border-left: 10px solid #ccc; margin: 1.5em 10px; padding: 0.5em 10px;">${reason}</blockquote>
          <p style="font-size: 16px; color: #333;">If you believe this was an error, please respond to this email with supporting documentation.</p>
          <hr style="border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #aaa; text-align: center;">MindMate &copy; ${new Date().getFullYear()}</p>
        </div>
      `,
    };
    await createTransporter().sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Error sending rejection email:", error);
    return false;
  }
};

/* ── Booking Confirmation ── */
export const sendBookingConfirmationEmail = async (email, userName, therapistName, slotDate, slotTime) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "MindMate — Session Booked Successfully!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <h2 style="color: #6860E6; text-align: center;">Session Confirmed</h2>
          <p style="font-size: 16px; color: #333;">Hello ${userName},</p>
          <p style="font-size: 16px; color: #333;">Your session with <strong>Dr. ${therapistName}</strong> has been successfully booked!</p>
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;">📅 <strong>Date:</strong> ${new Date(slotDate).toDateString()}</p>
            <p style="margin: 5px 0;">⏰ <strong>Time:</strong> ${slotTime}</p>
          </div>
          <p style="font-size: 16px; color: #333;">You can access your session chat directly from your "My Therapist" page when the session starts.</p>
          <hr style="border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #aaa; text-align: center;">MindMate &copy; ${new Date().getFullYear()}</p>
        </div>
      `,
    };
    await createTransporter().sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Error sending booking confirmation email:", error);
    return false;
  }
};

/* ── Refund Confirmation ── */
export const sendRefundEmail = async (email, userName, amount) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "MindMate — Refund Processed",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <h2 style="color: #ef4444; text-align: center;">Refund Initiated</h2>
          <p style="font-size: 16px; color: #333;">Hello ${userName},</p>
          <p style="font-size: 16px; color: #333;">Your booking was rejected by the therapist. We have processed a refund of <strong>₹${amount}</strong> to your original payment method. The amount should reflect in your account in 5-7 business days.</p>
          <hr style="border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #aaa; text-align: center;">MindMate &copy; ${new Date().getFullYear()}</p>
        </div>
      `,
    };
    await createTransporter().sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Error sending refund email:", error);
    return false;
  }
};
