import nodemailer from 'nodemailer';

let emailTransporter;
let transporterType = 'unknown';

if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
  emailTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
    tls: { rejectUnauthorized: false },
  });
  transporterType = 'gmail';
} else {
  emailTransporter = nodemailer.createTransport({ jsonTransport: true });
  transporterType = 'jsonTransport (NO REAL EMAILS SENT)';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, boardId, role } = req.body;

  let clientOrigin = 'https://aavl-trello.vercel.app';
  if (req.headers.origin) {
    clientOrigin = req.headers.origin;
  } else if (req.headers.referer) {
    try {
      const parsedReferer = new URL(req.headers.referer);
      clientOrigin = parsedReferer.origin;
    } catch (e) {}
  }

  const placeholderLink = `${clientOrigin}/boards/${boardId}`;
  try {
    const info = await emailTransporter.sendMail({
      from: process.env.GMAIL_USER || 'noreply@aavl.com',
      to: email,
      subject: `You've been invited to collaborate on AAVL Board`,
      html: `<div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;padding:24px;border:1px solid #e0e0e0;border-radius:12px">
        <h2 style="color:#6d28d9">🎯 AAVL Board Invitation</h2>
        <p>You have been invited as a <strong>${role}</strong> to a board.</p>
        <a href="${placeholderLink}" style="display:inline-block;margin-top:12px;padding:10px 24px;background:#6d28d9;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold">Open Board</a>
        <p style="margin-top:16px;font-size:12px;color:#888">Or copy this link: ${placeholderLink}</p>
      </div>`,
      text: `You have been invited as a ${role} to board ${boardId}. Use this link: ${placeholderLink}`,
    });
    console.log(`[EMAIL] sendMail result:`, JSON.stringify(info, null, 2));
    res.json({
      success: true,
      message: `Invitation sent to ${email} with role ${role}.`,
      signInLink: placeholderLink,
      role,
    });
  } catch (emailErr) {
    console.error('Email sending failed:', emailErr);
    res.status(500).json({ error: emailErr.message });
  }
}
