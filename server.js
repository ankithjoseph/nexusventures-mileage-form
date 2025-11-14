// Load environment variables from .env in development (requires dotenv installed)
import 'dotenv/config';

// Simple Express server for email functionality
// This can be deployed alongside the frontend

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { Resend } from 'resend';
import PocketBase from 'pocketbase';
import fs from 'fs/promises';
import FormData from 'form-data';

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
// Route -> metadata mapping used to inject server-side meta for crawlers
const ROUTE_META = {
  '/expense-report': {
    title: 'Expense Report - Nexus Ventures',
    description: 'Create and manage your expense reports.',
    image: '/logo.png',
  },
  '/mileage-book': {
    title: 'Mileage Book - Nexus Ventures',
    description: 'Log and manage mileage trips for tax purposes.',
    image: '/logo.png',
  },
  '/sepa-dd': {
    title: 'SEPA Direct Debit Mandate - Nexus Ventures',
    description: 'Submit your SEPA Direct Debit mandate to Nexus Ventures.',
    image: '/logo.png',
  },
  '/card-payment': {
    title: 'Card Payment Mandate- Nexus Ventures',
    description: 'Submit your Card Payment mandate to Nexus Ventures.',
    image: '/logo.png',
  },
  '/file-upload': {
    title: 'AML Compliance Form - Nexus Ventures',
    description: 'Submit your Anti-Money Laundering compliance form to Nexus Ventures.',
    image: '/logo.png',
  },
};

// --- Utility helpers for PocketBase multipart persistence and email sending ---

/** Return a fetch function to use for HTTP calls */
async function getFetcher() {
  if (fetchFn) return fetchFn;
  if (globalThis.fetch) return globalThis.fetch;
  // try dynamic import (should have been done earlier)
  try {
    const mod = await import('node-fetch');
    return mod.default ?? mod;
  } catch (e) {
    throw new Error('No fetch available');
  }
}

/** Apply PocketBase token from request headers/body onto a server-side pb client */
function applyPbTokenFromRequest(pbClient, req) {
  const authHeader = req.headers.authorization || req.headers['x-pb-token'] || req.body?.pb_token;
  if (!authHeader) return null;
  const token = typeof authHeader === 'string' && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : String(authHeader);
  try {
    if (pbClient.authStore && typeof pbClient.authStore.save === 'function') {
      pbClient.authStore.save(token, null);
      //console.log('Applied PocketBase auth token from request for server-side operations');
    } else if (pbClient.authStore) {
      pbClient.authStore.token = token;
      //console.log('Set pbServer.authStore.token from request');
    }
    return token;
  } catch (e) {
    console.warn('Failed to apply PocketBase auth token from request (continuing unauthenticated):', e?.message || e);
    return null;
  }
}

/** Build a multipart FormData for an expense report. Returns { form, usingWebFormData } */
function buildExpenseForm({ name, email, pps, type, req, base64, filename, pbClient }) {
  // Prefer WHATWG/FormData + Blob when available
  let form;
  let usingWebFormData = false;
  try {
    if (typeof globalThis.FormData === 'function' && typeof globalThis.Blob === 'function') {
      form = new globalThis.FormData();
      usingWebFormData = true;
    } else {
      form = new FormData();
    }
  } catch (e) {
    form = new FormData();
  }

  // Map Spanish -> English field ids
  form.append('name', name || '');
  form.append('email', email || '');
  form.append('pps', pps || '');
  form.append('trip_reason', req.body.motivo_viaje || '');
  form.append('trip_date', req.body.fecha_viaje || '');
  form.append('origin', req.body.origen || '');
  form.append('destination', req.body.destino || '');
  form.append('license_plate', req.body.matricula || '');
  form.append('make_model', req.body.marca_modelo || '');
  form.append('fuel_type', req.body.tipo_combustible || '');
  form.append('co2_g_km', req.body.co2_g_km || '');
  form.append('km_start', req.body.km_inicio || '');
  form.append('km_end', req.body.km_final || '');
  form.append('business_km', req.body.suma_km_trabajo || '');
  form.append('tolls', req.body.peajes || '');
  form.append('parking', req.body.parking || '');
  form.append('fuel_cost', req.body.combustible || '');
  form.append('meals', req.body.dietas || '');
  form.append('accommodation', req.body.alojamiento || '');
  form.append('notes', req.body.notas || '');
  form.append('signature', req.body.firma || '');
  form.append('signature_date', req.body.fecha_firma || '');
  form.append('form_type', type || 'expense-report');

  // Attach PDF
  try {
    const pdfBuffer = Buffer.from(base64, 'base64');
    if (usingWebFormData) {
      const pdfBlob = new globalThis.Blob([pdfBuffer], { type: 'application/pdf' });
      form.append('pdf', pdfBlob, filename);
    } else {
      form.append('pdf', pdfBuffer, { filename, contentType: 'application/pdf' });
    }
  } catch (bufErr) {
    console.warn('Failed to attach PDF buffer to FormData:', bufErr?.message || bufErr);
  }

  // user relation
  try {
    const suppliedUserId = req.body?.pb_user_id || req.body?.user || req.body?.userId || null;
    const authStoreUserId = pbClient?.authStore?.model?.id ?? pbClient?.authStore?.model?.record?.id ?? null;
    const userId = suppliedUserId || authStoreUserId;
    if (userId) form.append('user', String(userId));
  } catch (e) {
    // non-fatal
  }

  return { form, usingWebFormData };
}

/** Post a multipart form to PocketBase records API and return parsed JSON */
async function postFormToPocketBase({ form, usingWebFormData, pbClient }) {
  const fetcher = await getFetcher();
  const pbUrl = `${POCKETBASE_URL.replace(/\/$/, '')}/api/collections/expense_reports/records`;
  // headers: if node form-data, include boundary via getHeaders(); for web FormData, let fetch set it
  const headers = (typeof form.getHeaders === 'function') ? Object.assign({}, form.getHeaders()) : {};
  try {
    const token = pbClient?.authStore?.token;
    if (token) headers['Authorization'] = `Bearer ${token}`;
  } catch (e) {}

  const resp = await fetcher(pbUrl, { method: 'POST', headers, body: form });
  const text = await resp.text();
  let parsed = null;
  try { parsed = JSON.parse(text); } catch (e) { parsed = text; }
  if (!resp.ok) {
    const details = (typeof parsed === 'string') ? parsed : JSON.stringify(parsed);
    const err = new Error(`PocketBase HTTP ${resp.status}: ${details}`);
    err.response = parsed;
    throw err;
  }
  return parsed;
}

// --- end helpers ---



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

// Lightweight health/check endpoint to verify PocketBase reachability from the server.
app.get('/api/pb-health', async (req, res) => {
  try {
    const url = `${POCKETBASE_URL.replace(/\/$/, '')}/api/collections`;
    const resp = await fetch(url, { method: 'GET' });
    const text = await resp.text();
    return res.json({ ok: resp.ok, status: resp.status, bodyPreview: text.slice(0, 200), tokenPresent: Boolean(pbServer?.authStore?.token) });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e) });
  }
});

// Proxy endpoint to fetch protected PocketBase files server-side.
// Expects JSON body: { collection, recordId, filename }
// The client must forward the PocketBase auth token in the Authorization header
// (Bearer <token>) or x-pb-token to allow the server to perform the request
// using the same authenticated session. The server will exchange a short-lived
// file token and fetch the file from PocketBase, then stream the file bytes
// back to the client. This keeps the PocketBase file token and direct file
// URLs off the browser, and lets the server enforce access checks if desired.
app.post('/api/pb-file', async (req, res) => {
  try {
    const { collection, recordId, filename } = req.body || {};
    if (!collection || !recordId || !filename) return res.status(400).json({ error: 'missing parameters' });

    // Apply the incoming user's PocketBase token to the server-side client so
    // pbServer operations run in the context of that user.
    const applied = applyPbTokenFromRequest(pbServer, req);
    if (!applied) return res.status(401).json({ error: 'missing auth token' });

    const fetcher = await getFetcher();

    // Try to request a short-lived file token from PocketBase server-side.
    let fileToken = null;
    try {
      if (pbServer.files && typeof pbServer.files.getToken === 'function') {
        fileToken = await pbServer.files.getToken();
      }
    } catch (e) {
      // ignore — we'll attempt a direct fetch with Authorization header as fallback
      fileToken = null;
    }

    const base = POCKETBASE_URL.replace(/\/$/, '');
    const url = `${base}/api/files/${collection}/${recordId}/${encodeURIComponent(filename)}${fileToken ? `?token=${encodeURIComponent(fileToken)}` : ''}`;

    // Fetch the file bytes from PocketBase using the short-lived token (if present)
    // or using the current server-side authenticated session (pbServer.authStore.token)
    const headers = {};
    // If no fileToken, include Authorization header from the applied pbServer auth
    try {
      if (!fileToken && pbServer?.authStore?.token) headers['Authorization'] = `Bearer ${pbServer.authStore.token}`;
    } catch (e) {}

    const resp = await fetcher(url, { method: 'GET', headers });
    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      return res.status(resp.status).json({ ok: false, status: resp.status, body: text.slice ? text.slice(0, 200) : text });
    }

    // Read full body as arrayBuffer and send as binary response
    const arrayBuffer = await resp.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = resp.headers.get('content-type') || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    // Don't cache user-specific files
    res.setHeader('Cache-Control', 'no-store');
    // Let browser decide how to show it (inline) but include filename
    res.setHeader('Content-Disposition', `inline; filename="${filename.replace(/\"/g, '')}"`);
    res.setHeader('Content-Length', String(buffer.length));
    return res.status(200).send(buffer);
  } catch (err) {
    console.error('Error in /api/pb-file', err);
    return res.status(500).json({ error: String(err) });
  }
});



// Handle client-side routing - serve index.html for all non-API routes
app.get('*', async (req, res) => {
  // Skip API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }

  // If this path matches one of our known route metas, inject server-side
  // meta tags so crawlers that don't run JS receive a proper OpenGraph
  // preview for form pages.
  const normalizedPath = req.path.endsWith('/') && req.path.length > 1 ? req.path.slice(0, -1) : req.path;
  const meta = ROUTE_META[normalizedPath];
  if (meta) {
    const distIndex = path.join(__dirname, 'dist', 'index.html');
    const fallbackIndex = path.join(__dirname, 'index.html');
    try {
      let html = '';
      try {
        html = await fs.readFile(distIndex, 'utf8');
      } catch (e) {
        html = await fs.readFile(fallbackIndex, 'utf8');
      }

      const title = meta.title;
      const description = meta.description;
      const ogImage = meta.image || '/logo.png';
      const canonicalHref = `${req.protocol}://${req.get('host')}${req.originalUrl}`;

      // Replace or insert <title>
      if (/\<title[^>]*\>.*?\<\/title\>/i.test(html)) {
        html = html.replace(/\<title[^>]*\>.*?\<\/title\>/i, `<title>${title}</title>`);
      } else {
        html = html.replace(/<head([^>]*)>/i, `<head$1>\n    <title>${title}</title>`);
      }

      // Helper to upsert meta tags
      const upsertMeta = (selectorKey, tagHtml) => {
        const re = new RegExp(`<meta[^>]+(name|property)=["']${selectorKey}["'][^>]*>`, 'i');
        if (re.test(html)) {
          html = html.replace(re, tagHtml);
        } else {
          html = html.replace(/<head([^>]*)>/i, `<head$1>\n    ${tagHtml}`);
        }
      };

      upsertMeta('description', `<meta name="description" content="${description}">`);
      upsertMeta('og:description', `<meta property="og:description" content="${description}">`);
      upsertMeta('og:title', `<meta property="og:title" content="${title}">`);
      upsertMeta('twitter:title', `<meta name="twitter:title" content="${title}">`);
      upsertMeta('twitter:description', `<meta name="twitter:description" content="${description}">`);
      upsertMeta('og:image', `<meta property="og:image" content="${ogImage}">`);
      upsertMeta('twitter:image', `<meta name="twitter:image" content="${ogImage}">`);

      // canonical
      if (/\<link[^>]+rel=["']canonical["'][^>]*>/i.test(html)) {
        html = html.replace(/\<link[^>]+rel=["']canonical["'][^>]*>/i, `<link rel="canonical" href="${canonicalHref}" />`);
      } else {
        html = html.replace(/<head([^>]*)>/i, `<head$1>\n    <link rel="canonical" href="${canonicalHref}" />`);
      }

      // Prevent caching of the HTML shell so crawlers always get latest
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      return res.status(200).send(html);
    } catch (err) {
      console.error('Error preparing route-specific HTML:', err);
      // fall back to default behavior
    }
  }

  // Default: send SPA shell
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

    // Log incoming payload summary (mask email for privacy)
    const maskEmail = (em) => {
      try {
        if (!em || typeof em !== 'string') return em;
        const parts = em.split('@');
        if (parts[0].length <= 2) return '***@' + parts[1];
        return parts[0].slice(0, 2) + '***@' + parts[1];
      } catch (e) {
        return '***';
      }
    };
    console.log('Incoming send-email request:', {
      name: name?.slice(0, 40),
      email: maskEmail(email),
      pps,
      type,
      pdfDataLength: typeof pdfData === 'string' ? pdfData.length : undefined,
    });

    // Determine whether emailing is available. If not, we'll skip emailing but
    // continue to persist the submission (so PocketBase still receives records).
    const skipEmail = !resend;
    if (skipEmail) {
      console.warn('RESEND_API_KEY is not configured. Skipping email send but proceeding to persist submission to PocketBase.');
    }

    // Validate required fields per form type
    const isSepa = type === 'sepa';
    if (isSepa) {
      if (!name || !email || !pdfData) {
        return res.status(400).json({ error: 'Missing required fields for SEPA: name, email, pdfData' });
      }
    } else {
      if (!name || !email || !pps || !pdfData) {
        return res.status(400).json({ error: 'Missing required fields: name, email, pps, pdfData' });
      }
    }

    // Prepare email content based on form type
    const isExpenseReport = type === 'expense-report';
    const subject = isExpenseReport
      ? `Nuevo Expense Report - ${name}`
      : isSepa
      ? `Nuevo SEPA Mandate - ${name}`
      : `Nuevo Registro de Business Mileage - ${name}`;

    let html = '';
    if (isExpenseReport) {
      html = `
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
    `;
    } else if (isSepa) {
      html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1a365d; border-bottom: 2px solid #1a365d; padding-bottom: 10px;">Nuevo Mandato SEPA</h1>
        <p style="font-size: 16px; margin: 20px 0;">Se ha recibido un nuevo mandato SEPA.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Nombre:</strong></td>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${name}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Email:</strong></td>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${email}</td>
          </tr>
        </table>
        <p style="font-size: 14px; color: #666; margin: 20px 0;">El PDF del mandato SEPA está adjunto.</p>
      </div>
    `;
    } else {
      html = `
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
    }

    // Send email via Resend
  const filename = isExpenseReport ? 'expense-report.pdf' : isSepa ? 'sepa-mandate.pdf' : 'mileage-logbook.pdf';

    // Normalize pdfData: accept either raw base64 or data URL (data:...;base64,...)
    let base64 = pdfData ?? '';
    if (base64.startsWith('data:')) {
      const parts = base64.split(',');
      base64 = parts[1] || '';
    }

    try {
      // First: send admin copy (only when email sending is configured)
      let adminEmailId = null;
      if (!skipEmail) {
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

        adminEmailId = getEmailId(adminResp);
        if (!adminEmailId) {
          console.error('Unexpected Resend response for admin:', adminResp);
          return res.status(500).json({ error: 'Failed to send admin email', details: adminResp });
        }
      }

      // Persist submission to PocketBase collection `expense_reports` (best-effort).
      // The client sends the full form in the request body (see frontend). We'll attempt to
      // apply a logged-in user's auth token when provided, set the `user` relation, and upload the PDF into a file field.
      let pbSaved = { saved: false, id: null, error: null };
      try {
        // Apply token (if present) to pbServer
        applyPbTokenFromRequest(pbServer, req);

        console.log('Preparing to persist submission to PocketBase collection "expense_reports"');
        console.log('PocketBase base URL:', POCKETBASE_URL);
        console.log('pbServer.authStore present:', !!pbServer?.authStore);
        try { console.log('pbServer.authStore.token present:', Boolean(pbServer?.authStore?.token)); } catch (tErr) {}

        // Build form and POST via helper functions
        const { form, usingWebFormData } = buildExpenseForm({ name, email, pps, type, req, base64, filename, pbClient: pbServer });
        const pbResult = await postFormToPocketBase({ form, usingWebFormData, pbClient: pbServer });
        pbSaved = { saved: true, id: pbResult?.id ?? null, error: null };
        console.log('Saved expense report to PocketBase (with file):', pbSaved.id ?? '(no id)');
      } catch (pbErr) {
        pbSaved = { saved: false, id: null, error: String(pbErr?.message || pbErr) };
        console.warn('PocketBase save (expense_reports) failed (non-fatal):', pbErr?.message || pbErr);
      }

      // Then: attempt to send customer copy, but don't fail the whole request if it errors
      let customerResult = { sent: false };
      if (skipEmail) {
        customerResult = { sent: false, error: 'resend_not_configured' };
      } else {
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
            } else if (isSepa) {
              // SEPA customer confirmation
              customerFrom = `${FROM_NAME} <${FROM_ADDRESS}>`;
              customerSubject = `Confirmación - Mandato SEPA`;
              customerHtml = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h1 style="color: #1a365d; border-bottom: 2px solid #1a365d; padding-bottom: 10px;">Gracias por enviar su Mandato SEPA</h1>
                  <p style="font-size: 16px; margin: 20px 0;">Estimado/a ${name},</p>
                  <p style="font-size: 16px; margin: 20px 0;">Hemos recibido su Mandato SEPA. Adjuntamos una copia para sus registros.</p>
                  <!-- IBAN omitted from customer confirmation for privacy -->
                  <p style="font-size: 14px; color: #718096; margin-top: 30px;">Si tiene alguna pregunta, no dude en contactarnos.</p>
                  <p style="font-size: 14px; margin-top: 30px;">Saludos cordiales,<br><strong>Nexus Ventures Team</strong></p>
                </div>
              `;
              customerFilename = `mi-mandato-sepa-${today}.pdf`;
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
      }

      // Return success for admin and include customer result and PocketBase persistence info so UI can surface partial failures
      return res.json({
        success: true,
        message: 'Admin email sent',
        adminEmailId,
        customer: customerResult,
        pocketbase: pbSaved,
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

// Send admin email for AML application identified by PocketBase record id
app.post('/api/send-aml', async (req, res) => {
  try {
    if (!resend) {
      console.error('RESEND_API_KEY is not configured. Cannot send AML email.');
      return res.status(500).json({ error: 'RESEND_API_KEY not configured on server' });
    }

    const { recordId } = req.body || {};
    if (!recordId) return res.status(400).json({ error: 'recordId required' });

    // Fetch record from PocketBase
    let record;
    try {
      record = await pbServer.collection('aml_applications').getOne(recordId);
    } catch (e) {
      console.error('Failed to fetch AML record from PocketBase:', e);
      return res.status(500).json({ error: 'failed_fetch_record' });
    }

    // Collect simple fields for email
    const fullName = record.full_name ?? record.name ?? '';
    const email = record.email ?? '';
    const phone = record.phone ?? '';
    const clientType = record.client_type ?? '';
    const createdAt = record.created ?? record.createdAt ?? '';

    // Detect file fields — PocketBase stores file fields as arrays of filenames
    const fileEntries = [];
    for (const k of Object.keys(record)) {
      const v = record[k];
      if (Array.isArray(v) && v.length > 0 && v.every((x) => typeof x === 'string')) {
        for (const filename of v) fileEntries.push({ field: k, filename });
      }
      // Some installations may store a single filename as string
      if (typeof v === 'string' && /\.[a-z0-9]{2,6}(?:\?|$)/i.test(v)) {
        fileEntries.push({ field: k, filename: v });
      }
    }

    // Download files and prepare attachments
    const attachments = [];
    for (const fe of fileEntries) {
      try {
        // Construct file URL using PocketBase files API
        const fileUrl = `${POCKETBASE_URL.replace(/\/$/, '')}/api/files/aml_applications/${encodeURIComponent(recordId)}/${encodeURIComponent(fe.filename)}`;
        if (!fetchFn) {
          console.error('No fetch available to download file:', fileUrl);
          continue;
        }
        const fRes = await fetchFn(fileUrl);
        if (!fRes || !fRes.ok) {
          console.warn('Failed to download file:', fileUrl, fRes && fRes.status);
          continue;
        }
        const arrayBuffer = await fRes.arrayBuffer();
        const buf = Buffer.from(arrayBuffer);
        const b64 = buf.toString('base64');

        // Simple mime type detection from extension
        const lower = fe.filename.toLowerCase();
        let mime = 'application/octet-stream';
        if (lower.endsWith('.pdf')) mime = 'application/pdf';
        else if (lower.endsWith('.png')) mime = 'image/png';
        else if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) mime = 'image/jpeg';
        else if (lower.endsWith('.gif')) mime = 'image/gif';

        attachments.push({ filename: fe.filename, content: b64, type: mime });
      } catch (e) {
        console.warn('Error fetching file for AML email:', fe, e?.message ?? e);
        continue;
      }
    }

    const subject = `New AML application - ${fullName || recordId}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto;">
        <h2>New AML application received</h2>
        <table style="width:100%; border-collapse: collapse;">
          <tr><td style="padding:8px; border-bottom:1px solid #eee;"><strong>Full name</strong></td><td style="padding:8px; border-bottom:1px solid #eee;">${fullName}</td></tr>
          <tr><td style="padding:8px; border-bottom:1px solid #eee;"><strong>Email</strong></td><td style="padding:8px; border-bottom:1px solid #eee;">${email}</td></tr>
          <tr><td style="padding:8px; border-bottom:1px solid #eee;"><strong>Phone</strong></td><td style="padding:8px; border-bottom:1px solid #eee;">${phone}</td></tr>
          <tr><td style="padding:8px; border-bottom:1px solid #eee;"><strong>Client type</strong></td><td style="padding:8px; border-bottom:1px solid #eee;">${clientType}</td></tr>
          <tr><td style="padding:8px; border-bottom:1px solid #eee;"><strong>Submitted</strong></td><td style="padding:8px; border-bottom:1px solid #eee;">${createdAt}</td></tr>
        </table>
        <p style="margin-top:16px;">Attached files are included below.</p>
      </div>
    `;

    // send admin email
    try {
      const adminResp = await resend.emails.send({
        from: FROM,
        to: [ADMIN_EMAIL],
        subject,
        html,
        attachments: attachments.map((a) => ({ filename: a.filename, content: a.content, type: a.type })),
      });

      const adminEmailId = getEmailId(adminResp);
      return res.json({ success: true, adminEmailId, attachmentsCount: attachments.length });
    } catch (e) {
      console.error('Failed to send AML admin email via Resend:', e);
      return res.status(500).json({ error: 'failed_send_email' });
    }
  } catch (err) {
    console.error('send-aml server error:', err);
    return res.status(500).json({ error: 'server_error' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

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
      const list = await pbServer.collection('users').getList(1, 1, { filter: `email = "${email.toLowerCase()}"` });
      if (!list || list.total === 0) {
        return res.status(400).json({ error: 'Account does not exist. Please sign up first.' });
      }
    } catch (e) {
      console.error('PocketBase user lookup failed', e);
      // We'll continue with a generic message to avoid leaking errors
      return res.status(500).json({ error: 'backend_error' });
    }

    // Request the password reset via the server-side PocketBase client
    try {
      await pbServer.collection('users').requestPasswordReset(email);
      return res.json({ success: true, message: 'Reset email sent.' });
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

// NOTE: server-side AML file upload endpoint removed. Uploads should be handled
// directly by the client against PocketBase or an upload-specific server/service.

const server = app.listen(port, '0.0.0.0', () => {
  console.log(`Email server running on port ${port}`);
});

// Handle graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(`Received ${signal}, shutting down gracefully...`);
  
  server.close((err) => {
    if (err) {
      console.error('Error during server shutdown:', err);
      process.exit(1);
    }
    
    console.log('Server closed successfully');
    process.exit(0);
  });
  
  // Force close after 10 seconds
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

// Handle Docker container stop (SIGTERM) and development stop (SIGINT)
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));