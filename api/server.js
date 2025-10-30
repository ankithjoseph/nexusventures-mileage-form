const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Allow large payloads for PDF data

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../dist')));

// Email sending endpoint
app.post('/api/send-expense-report', async (req, res) => {
  try {
    const { name, email, pps, pdfData } = req.body;

    // Validate required fields
    if (!name || !email || !pps || !pdfData) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Prepare email data for Resend API
    const emailData = {
      from: 'Nexus Ventures Expense Report <log@happydreamsireland.com>',
      to: ['jesus@irishtaxagents.com'],
      subject: `Nuevo Expense Report - ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1a365d; border-bottom: 2px solid #1a365d; padding-bottom: 10px;">
            Nuevo Expense Report
          </h1>

          <p style="font-size: 16px; margin: 20px 0;">
            Se ha recibido un nuevo expense report.
          </p>

          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Nombre:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Email:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${email}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>PPS:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${pps}</td>
            </tr>
          </table>

          <p style="font-size: 14px; color: #666; margin: 20px 0;">
            El PDF del expense report está adjunto.
          </p>
        </div>
      `,
      attachments: [
        {
          filename: 'expense-report.pdf',
          content: pdfData,
          type: 'application/pdf',
        },
      ],
    };

    // Send email via Resend API
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify(emailData),
    });

    if (!resendResponse.ok) {
      const errorData = await resendResponse.text();
      console.error('Resend API error:', errorData);
      return res.status(500).json({ error: 'Failed to send email' });
    }

    const result = await resendResponse.json();
    console.log('Email sent successfully:', result);

    res.json({ success: true, message: 'Email sent successfully' });

  } catch (error) {
    console.error('Email sending error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Catch all handler: send back React's index.html file for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});