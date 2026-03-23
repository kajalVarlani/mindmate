async function test() {
  try {
    const res = await fetch("https://mindmate-4zg6.onrender.com/api/auth/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "mindmate31@gmail.com" })
    });
    console.log("Status:", res.status);
    console.log("Response:", await res.text());
  } catch (err) {
    console.error("Error:", err);
  }
}
test();
