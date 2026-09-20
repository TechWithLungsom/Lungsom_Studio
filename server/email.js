export async function sendEnquiry(enquiry, config) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': `enquiry/${enquiry.requestId}`,
    },
    body: JSON.stringify({
      from: config.EMAIL_FROM,
      to: [config.CONTACT_TO || 'lungsomlamnio@gmail.com'],
      reply_to: enquiry.email,
      subject: `New ${enquiry.service} enquiry — Lungsom Studio`,
      text: `New project enquiry\n\nName: ${enquiry.name}\nEmail: ${enquiry.email}\nService: ${enquiry.service}\n\n${enquiry.brief}\n\nReference: ${enquiry.requestId}`,
    }),
    signal: AbortSignal.timeout(12000),
  });
  const result = await response.json();
  if (!response.ok || !result.id) throw new Error('Email provider did not accept the enquiry');
  return result.id;
}
