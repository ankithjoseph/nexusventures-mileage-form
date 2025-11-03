// Simple Express server for email functionality
// This can be deployed alongside the frontend

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { Resend } from 'resend';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Serve static files from dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Handle client-side routing - serve index.html for all non-API routes
app.get('*', (req, res) => {
  // Skip API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Initialize Resend
const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

app.post('/api/send-email', async (req, res) => {
  try {
    const { name, email, pps, pdfData, type } = req.body;

    // Check if Resend is configured
    if (!resend) {
      console.log('Email would be sent with data:', { name, email, pps, type, pdfDataLength: pdfData?.length });
      return res.json({
        success: true,
        message: 'Email simulated successfully (Resend API key not configured)',
        simulated: true
      });
    }

    // Validate required fields
    if (!name || !email || !pps || !pdfData) {
      return res.status(400).json({
        error: 'Missing required fields: name, email, pps, pdfData'
      });
    }

    // Prepare email content based on form type
    const isExpenseReport = type === 'expense-report';
    const subject = isExpenseReport
      ? `Nuevo Expense Report - ${name}`
      : `Nuevo Registro de Business Mileage - ${name}`;

    const html = isExpenseReport ? `
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
    ` : `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1a365d; border-bottom: 2px solid #1a365d; padding-bottom: 10px;">
          Nuevo Registro de Business Mileage
        </h1>
        <p style="font-size: 16px; margin: 20px 0;">
          Se ha recibido un nuevo registro de mileage logbook.
        </p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Conductor:</strong></td>
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
          El PDF del registro está adjunto.
        </p>
      </div>
    `;

    // Send email via Resend
    const filename = isExpenseReport ? 'expense-report.pdf' : 'mileage-logbook.pdf';

    // Normalize pdfData: accept either raw base64 or data URL (data:...;base64,...)
    let base64 = pdfData ?? '';
    if (base64.startsWith('data:')) {
      const parts = base64.split(',');
      base64 = parts[1] || '';
    }

    try {
      const resp = await resend.emails.send({
        from: 'Nexus Ventures <noreply@nexusventures.eu>',
        to: ['ankeyit@gmail.com'],
        subject,
        html,
        attachments: [
          {
            name: filename,
            data: base64,
            type: 'application/pdf',
          },
        ],
      });

      // Resend SDK returns an object with `id` on success
      const emailId = resp?.id;
      if (!emailId) {
        console.error('Unexpected Resend response:', resp);
        return res.status(500).json({ error: 'Failed to send email' });
      }

      res.json({ success: true, message: 'Email sent successfully', emailId });
    } catch (err) {
      console.error('Resend error:', err);
      return res.status(500).json({ error: 'Failed to send email' });
    }

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`Email server running on port ${port}`);
});