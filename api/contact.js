import nodemailer from 'nodemailer';

function parseBody(req) {
  const raw = req.body;
  if (raw == null) return {};
  if (typeof raw === 'object' && !Buffer.isBuffer(raw)) return raw;
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }
  return {};
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const data = parseBody(req);
  const name = typeof data.name === 'string' ? data.name.trim() : '';
  const email = typeof data.email === 'string' ? data.email.trim() : '';
  const message = typeof data.message === 'string' ? data.message.trim() : '';
  const phone = typeof data.phone === 'string' ? data.phone.trim() : '';
  const subjectField = typeof data.subject === 'string' ? data.subject.trim() : '';

  if (!name || !email || !message) {
    return res.status(400).json({ message: 'Name, email, and message are required.' });
  }

  const pass = process.env.EMAIL_PASSWORD;
  console.log("EMAIL PASSWORD LOADED:", process.env.EMAIL_PASSWORD);
  if (!pass) {
    console.error('EMAIL_PASSWORD is not set');
    return res.status(500).json({ message: 'Server email is not configured.' });
  }

  const transporter = nodemailer.createTransport({
    host: "smtpout.secureserver.net",
    port: 465,
    secure: true, // SSL
    auth: {
      user: "support@hopecredit.co.in",
      pass: pass,
    },
  });

  const mailOptions = {
    from: `"Website Contact" <support@hopecredit.co.in>`,
    to: 'support@hopecredit.co.in',
    replyTo: email,
    subject: subjectField ? `Contact: ${subjectField}` : 'New Contact Form Message',
    text: `
Name: ${name}
Email: ${email}
Phone: ${phone || '—'}
Subject: ${subjectField || '—'}

Message:
${message}
    `.trim(),
  };

  try {
    await transporter.sendMail(mailOptions);
    return res.status(200).json({ message: 'Message sent successfully!' });
  } catch (error) {
    console.error('Email Error:', error);
    return res.status(500).json({ message: 'Failed to send the message.' });
  }
}
