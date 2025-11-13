import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

type ExternalRedirectProps = {
  url: string;
};

// Static list of app routes (kept in sync with src/App.tsx)
const APP_ROUTES = [
  { path: '/', label: 'Root (redirect to external site)' },
  { path: '/login', label: 'Login' },
  { path: '/verify-email', label: 'Verify email' },
  { path: '/reset-password', label: 'Reset password' },
  { path: '/expense-report', label: 'Expense Report' },
  { path: '/mileage-book', label: 'Mileage Book' },
  { path: '/sepa-dd', label: 'SEPA Direct Debit' },
  { path: '/card-payment', label: 'Card Payment' },
  { path: '/aml-form', label: 'File Upload' },
  { path: '/company-incorporation', label: 'Company Incorporation' },
  { path: '/404', label: '404 / Not found' },
];

const ExternalRedirect: React.FC<ExternalRedirectProps> = ({ url }) => {
  const isDev = Boolean((import.meta as any).env?.DEV);

  useEffect(() => {
    // In production redirect immediately using replace so the back button doesn't keep the redirect route in history
    if (!isDev) {
      window.location.replace(url);
    }
  }, [url, isDev]);

  // In dev mode, show a helpful list of routes so developers can navigate the app instead of being bounced out.
  if (isDev) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-6">
        <div className="text-center">
          <h2 className="text-lg font-semibold">Development mode — app routes</h2>
          <p className="text-sm text-muted-foreground">Click any route to navigate inside the app. In production this page redirects to the external site.</p>
        </div>

        <ul className="flex flex-col gap-2">
          {APP_ROUTES.map((r) => (
            <li key={r.path}>
              <Link to={r.path} className="underline text-primary">
                {r.label} — <span className="text-xs text-muted-foreground">{r.path}</span>
              </Link>
            </li>
          ))}
        </ul>

        <div className="pt-4 text-sm text-muted-foreground">
          External redirect target: <a href={url} className="underline text-primary">{url}</a>
        </div>
      </div>
    );
  }

  // Fallback content for production (redirect should already have occurred)
  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-sm text-muted-foreground">
        Redirecting to <a href={url} className="underline text-primary">{url}</a>...
      </p>
    </div>
  );
};

export default ExternalRedirect;
