export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const recipientRaw = process.env.EMAIL_RECIPIENT;
  const bccRaw = process.env.EMAIL_BCC;

  if (!apiKey || !recipientRaw) {
    console.error('RESEND_API_KEY or EMAIL_RECIPIENT not set in environment');
    return res.status(500).json({ error: 'Server email configuration missing' });
  }

  const recipients = recipientRaw.split(',').map(e => e.trim()).filter(Boolean);
  const bcc = bccRaw ? bccRaw.split(',').map(e => e.trim()).filter(Boolean) : [];

  const { name, phone, interest, introduction, reference } = req.body || {};

  if (!name || !name.trim() || !phone || !phone.trim()) {
    return res.status(400).json({ error: 'Name and phone are required' });
  }

  const escapeHtml = (str) =>
    String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: sans-serif; color: #333; line-height: 1.6; }
        h2 { color: #AF862D; }
        .field { margin-bottom: 16px; }
        .label { font-weight: bold; }
        hr { margin: 20px 0; border: none; border-top: 1px solid #ddd; }
        .footer { font-size: 12px; color: #666; margin-top: 20px; }
      </style>
    </head>
    <body>
      <h2>New Membership Inquiry - Prime Collective</h2>
      <div class="field"><div class="label">Name:</div><div>${escapeHtml(name.trim())}</div></div>
      <div class="field"><div class="label">Phone:</div><div>${escapeHtml(phone.trim())}</div></div>
      <div class="field"><div class="label">Wine Preferences:</div><div>${escapeHtml(interest?.trim() || 'Not provided')}</div></div>
      <div class="field"><div class="label">Introduced via:</div><div>${escapeHtml(introduction?.trim() || 'Not provided')}</div></div>
      ${reference?.trim() ? `<div class="field"><div class="label">Reference:</div><div>${escapeHtml(reference.trim())}</div></div>` : ''}
      <div class="field"><div class="label">Submitted:</div><div>${new Date().toLocaleString('en-MY', { timeZone: 'Asia/Kuala_Lumpur' })}</div></div>
      <hr>
      <p class="footer">This inquiry was submitted via the Prime Collective landing page.</p>
    </body>
    </html>
  `;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: 'Prime Collective <website@primecollective.asia>',
        to: recipients,
        ...(bcc.length > 0 && { bcc }),
        subject: 'New Membership Inquiry - Prime Collective',
        html: emailHtml,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Resend API error:', error);
      return res.status(502).json({ error: 'Failed to send email' });
    }

    const data = await response.json();
    return res.status(200).json({ success: true, id: data.id });
  } catch (err) {
    console.error('Email send error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
