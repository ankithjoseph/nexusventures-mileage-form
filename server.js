// Simple Express server for email functionality
// This can be deployed alongside the frontend

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { Resend } from 'resend';
import PocketBase from 'pocketbase';

// Use global fetch when available (Node 18+). If not present, try to dynamically
// import `node-fetch`. We avoid a static import so the server can run without
// node-fetch installed if the runtime already provides `fetch`.
let fetchFn = globalThis.fetch;
(async () => {
  if (!fetchFn) {
    try {
      const mod = await import('node-fetch');
      fetchFn = mod.default ?? mod;
    } catch (e) {
      console.warn('node-fetch not found and global fetch not available. reCAPTCHA verification will not work.', e);
    }
  }
})();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '20mb' }));

// Simple in-memory rate limiter (per-email and per-IP). This is intentionally
// small and lightweight: it protects the password-reset endpoint from abuse.
// For production, consider a shared store (Redis) so multiple server instances
// share state.
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS_PER_EMAIL = 3;
const MAX_REQUESTS_PER_IP = 10;
const emailRateMap = new Map(); // email -> { count, firstAt }
const ipRateMap = new Map(); // ip -> { count, firstAt }

// PocketBase client for server-side operations
const POCKETBASE_URL = process.env.POCKETBASE_URL || process.env.VITE_POCKETBASE_URL || 'http://127.0.0.1:8090';
const pbServer = new PocketBase(POCKETBASE_URL);

// Helper to check & increment rate limits; returns { ok: boolean, reason?: string }
function checkAndIncrRate(map, key, max) {
  const now = Date.now();
  const existing = map.get(key);
  if (!existing) {
    map.set(key, { count: 1, firstAt: now });
    return { ok: true };
  }
  if (now - existing.firstAt > RATE_LIMIT_WINDOW_MS) {
    // reset window
    map.set(key, { count: 1, firstAt: now });
    return { ok: true };
  }
  if (existing.count >= max) {
    return { ok: false, reason: 'rate_limited' };
  }
  existing.count += 1;
  map.set(key, existing);
  return { ok: true };
}


// Serve static files from dist directory
// Set a long cache lifetime for static assets (fingerprinted), but ensure the
// SPA shell (index.html) is never cached by clients or intermediary CDNs so
// users always get the latest asset manifest after a deploy.
app.use(express.static(path.join(__dirname, 'dist'), {
  maxAge: '1y',
}));

// Handle client-side routing - serve index.html for all non-API routes
app.get('*', (req, res) => {
  // Skip API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  // Prevent caching of the HTML shell so browsers will revalidate on each
  // navigation and pick up new asset file names after deployments. This helps
  // avoid situations where a client has a stale index.html that references
  // non-existent hashed JS files (which causes MIME-type errors).
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Initialize Resend
const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;
console.log('Resend configured:', Boolean(resend));
// Helper to extract email id from Resend responses (SDK may return { id } or { data: { id } })
const getEmailId = (resp) => resp?.id ?? resp?.data?.id ?? null;
// Environment-configurable addresses
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'jesus@irishtaxagents.com';
const FROM_NAME = process.env.FROM_NAME || 'Nexus Ventures';
const FROM_ADDRESS = process.env.FROM_ADDRESS || 'noreply@nexusventures.eu';
const FROM = `${FROM_NAME} <${FROM_ADDRESS}>`;

app.post('/api/send-email', async (req, res) => {
  try {
    const { name, email, pps, pdfData, type } = req.body;

    // Log incoming payload summary
    console.log('Incoming send-email request:', {
      name: name?.slice(0, 40),
      email,
      pps,
      type,
      pdfDataLength: typeof pdfData === 'string' ? pdfData.length : undefined,
    });

    // Check if Resend is configured
    if (!resend) {
      console.error('RESEND_API_KEY is not configured. Cannot send email.');
      return res.status(500).json({ error: 'RESEND_API_KEY not configured on server' });
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
      // First: send admin copy
      const adminResp = await resend.emails.send({
        from: FROM,
        to: [ADMIN_EMAIL],
        subject,
        html,
        attachments: [
          {
            filename: filename,
            content: base64,
            type: 'application/pdf',
          },
        ],
      });

      const adminEmailId = getEmailId(adminResp);
      if (!adminEmailId) {
        console.error('Unexpected Resend response for admin:', adminResp);
        return res.status(500).json({ error: 'Failed to send admin email', details: adminResp });
      }

      // Then: attempt to send customer copy, but don't fail the whole request if it errors
      let customerResult = { sent: false };
      try {
        // validate simple email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          customerResult = { sent: false, error: 'Invalid customer email' };
          console.warn('Skipping customer send: invalid email', email);
        } else {
            // Build user-facing email based on form type to match provided templates
            const today = new Date().toISOString().split('T')[0];
            let customerFrom = `${FROM_NAME} <${FROM_ADDRESS}>`;
            let customerSubject = `Confirmación - ${subject}`;
            let customerHtml = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;"><p>Estimado/a ${name},</p><p>Gracias — una copia de su documento enviado está adjunta.</p></div>`;
            let customerFilename = `copy-${filename}`;

            if (isExpenseReport) {
              customerFrom = `${FROM_NAME} Expense Report <${FROM_ADDRESS}>`;
              customerSubject = `Confirmación de Informe - Gastos por Viajes de Trabajo`;
              customerHtml = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h1 style="color: #1a365d; border-bottom: 2px solid #1a365d; padding-bottom: 10px;">
                    Gracias por su informe
                  </h1>

                  <p style="font-size: 16px; margin: 20px 0;">
                    Estimado/a ${name},
                  </p>

                  <p style="font-size: 16px; margin: 20px 0;">
                    Hemos recibido exitosamente su informe de gastos por viajes de trabajo.
                    Adjuntamos una copia del mismo para sus registros.
                  </p>

                  <div style="background-color: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 0; color: #2d3748;">
                      <strong>PPS:</strong> ${pps}
                    </p>
                  </div>

                  <p style="font-size: 14px; color: #718096; margin-top: 30px;">
                    Si tiene alguna pregunta, no dude en contactarnos.
                  </p>

                  <p style="font-size: 14px; margin-top: 30px;">
                    Saludos cordiales,<br>
                    <strong>Nexus Ventures Team</strong>
                  </p>

                  <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center;">
                    <a href="https://www.nexusventures.eu" style="color: #1a365d; text-decoration: none;">www.nexusventures.eu</a>
                  </div>
                </div>
              `;
              customerFilename = `mi-informe-gastos-${today}.pdf`;
            } else {
              // mileage/logbook
              customerFrom = `${FROM_NAME} <${FROM_ADDRESS}>`;
              customerSubject = `Confirmación de Registro - Business Mileage Logbook`;
              customerHtml = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h1 style="color: #1a365d; border-bottom: 2px solid #1a365d; padding-bottom: 10px;">
                    Gracias por su registro
                  </h1>

                  <p style="font-size: 16px; margin: 20px 0;">
                    Estimado/a ${name},
                  </p>

                  <p style="font-size: 16px; margin: 20px 0;">
                    Hemos recibido exitosamente su formulario de Business Mileage Logbook. 
                    Adjuntamos una copia del mismo para sus registros.
                  </p>

                  <div style="background-color: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 0; color: #2d3748;">
                      <strong>Vehículo:</strong> ${filename.includes('mileage-logbook') ? '' : ''}
                    </p>
                  </div>

                  <p style="font-size: 14px; color: #718096; margin-top: 30px;">
                    Si tiene alguna pregunta, no dude en contactarnos.
                  </p>

                  <p style="font-size: 14px; margin-top: 30px;">
                    Saludos cordiales,<br>
                    <strong>Nexus Ventures Team</strong>
                  </p>

                  <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center;">
                    <a href="https://www.nexusventures.eu" style="color: #1a365d; text-decoration: none;">www.nexusventures.eu</a>
                  </div>
                </div>
              `;
              customerFilename = `mi-logbook-${today}.pdf`;
            }

            const customerResp = await resend.emails.send({
              from: customerFrom,
              to: [email],
              subject: customerSubject,
              html: customerHtml,
              attachments: [
                {
                  filename: customerFilename,
                  content: base64,
                  type: 'application/pdf',
                },
              ],
            });
          const customerEmailId = getEmailId(customerResp);
          if (customerEmailId) {
            customerResult = { sent: true, emailId: customerEmailId };
          } else {
            customerResult = { sent: false, error: customerResp };
            console.error('Unexpected Resend response for customer:', customerResp);
          }
        }
      } catch (custErr) {
        console.error('Customer send error:', custErr);
        customerResult = { sent: false, error: custErr?.message || String(custErr) };
      }

      // Return success for admin and include customer result so UI can surface partial failures
      return res.json({
        success: true,
        message: 'Admin email sent',
        adminEmailId,
        customer: customerResult,
      });

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

// Password reset request endpoint with reCAPTCHA and rate-limiting.
app.post('/api/request-password-reset', async (req, res) => {
  try {
    const { email, recaptchaToken } = req.body || {};
    const ip = req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'unknown';

    if (!email) {
      return res.status(400).json({ error: 'email required' });
    }

    // Verify reCAPTCHA if configured
    const RECAPTCHA_SECRET = process.env.RECAPTCHA_SECRET;
    if (RECAPTCHA_SECRET) {
      if (!recaptchaToken) {
        return res.status(400).json({ error: 'recaptcha token required' });
      }

      try {
        if (!fetchFn) {
          console.error('No fetch available for reCAPTCHA verification (global fetch missing and node-fetch not installed)');
          return res.status(500).json({ error: 'fetch_unavailable' });
        }

        const verifyRes = await fetchFn('https://www.google.com/recaptcha/api/siteverify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `secret=${encodeURIComponent(RECAPTCHA_SECRET)}&response=${encodeURIComponent(recaptchaToken)}&remoteip=${encodeURIComponent(ip)}`,
        });
        const verifyJson = await verifyRes.json();
        if (!verifyJson.success) {
          console.warn('reCAPTCHA failed', verifyJson);
          return res.status(400).json({ error: 'recaptcha_failed', details: verifyJson });
        }
      } catch (e) {
        console.error('reCAPTCHA verification error', e);
        return res.status(500).json({ error: 'recaptcha_verification_error' });
      }
    } else {
      console.warn('RECAPTCHA_SECRET not configured — skipping verification');
    }

    // check IP rate limit
    const ipCheck = checkAndIncrRate(ipRateMap, ip, MAX_REQUESTS_PER_IP);
    if (!ipCheck.ok) return res.status(429).json({ error: 'ip_rate_limited' });

    // check email rate limit
    const emailCheck = checkAndIncrRate(emailRateMap, email.toLowerCase(), MAX_REQUESTS_PER_EMAIL);
    if (!emailCheck.ok) return res.status(429).json({ error: 'email_rate_limited' });

    // Confirm user exists in PocketBase (server-side) before requesting reset
    try {
      const list = await pbServer.collection('users').getList(1, 1, { filter: `email = "${email}"` });
      if (!list || list.total === 0) {
        // Do not reveal too much: respond with success-like message but don't send email.
        return res.json({ success: true, message: 'If an account exists, a reset link will be sent.' });
      }
    } catch (e) {
      console.error('PocketBase user lookup failed', e);
      // We'll continue with a generic message to avoid leaking errors
      return res.status(500).json({ error: 'backend_error' });
    }

    // Request the password reset via the server-side PocketBase client
    try {
      await pbServer.collection('users').requestPasswordReset(email);
      return res.json({ success: true, message: 'Reset email sent (if account exists).' });
    } catch (err) {
      console.error('requestPasswordReset failed', err);
      // Avoid leaking provider errors to clients
      return res.status(500).json({ error: 'failed_to_send' });
    }
  } catch (err) {
    console.error('request-password-reset server error', err);
    return res.status(500).json({ error: 'server_error' });
  }
});