import "dotenv/config";
import { sendOTP } from "./utils/sendEmail.js";

async function test() {
  console.log("Testing sendOTP...");
  const success = await sendOTP(process.env.EMAIL_USER, "123456");
  if (success) {
    console.log("Successfully sent OTP.");
  } else {
    console.log("Failed to send OTP.");
  }
}

test();
