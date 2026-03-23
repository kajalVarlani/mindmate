async function test() {
  try {
    const res = await fetch("http://localhost:8080/api/auth/send-otp", {
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
