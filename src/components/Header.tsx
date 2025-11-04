import { Link, useLocation } from "react-router-dom";
import { FileText, Receipt, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from 'react';
import { toast } from 'sonner';
import nexusLogo from "@/assets/nexus-ventures-logo.png";

export const Header = () => {
  const location = useLocation();
  const { t, toggleLanguage, language } = useLanguage();

  // Determine title based on current route
  const getPageTitle = () => {
    if (location.pathname === '/expense-report') {
      return t('app.title.expense');
    }
    return t('app.title.mileage');
  };

  return (
    <header className="bg-card border-b sticky top-0 z-10 shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src={nexusLogo}
              alt="Nexus Ventures Logo"
              className="h-12 w-auto object-contain"
            />
            <div>
              <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
                <FileText className="w-6 h-6" />
                {getPageTitle()}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {t('app.subtitle')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <nav className="flex gap-4">
              <Link
                to="/"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === "/"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-primary"
                }`}
              >
                <FileText className="w-4 h-4 inline mr-2" />
                {t('nav.mileage')}
              </Link>
              <Link
                to="/expense-report"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === "/expense-report"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-primary"
                }`}
              >
                <Receipt className="w-4 h-4 inline mr-2" />
                {t('nav.expense')}
              </Link>
            </nav>
            <div className="flex items-center gap-2">
              <Button
                onClick={toggleLanguage}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Languages className="w-4 h-4" />
                {t('lang.toggle')}
              </Button>

              {/* Auth UI */}
              <AuthControls />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

const AuthControls = () => {
  const { user, login, logout, loading } = useAuth();
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      await login(email, password);
      toast.success('Logged in');
      setShow(false);
    } catch (err: any) {
      console.error('Login error', err);
      toast.error(err?.message || 'Login failed');
    }
  };

  if (user) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">{user.email || user.username || user.id}</span>
        <Button size="sm" variant="ghost" onClick={() => logout()}>Logout</Button>
      </div>
    );
  }

  return (
    <div className="relative">
      <Button size="sm" onClick={() => setShow(s => !s)}>{show ? 'Close' : 'Login'}</Button>
      {show && (
        <div className="absolute right-0 mt-2 w-64 bg-card border rounded-md p-3 shadow-lg z-20">
          <label className="block text-xs text-muted-foreground">Email</label>
          <input className="w-full mb-2 px-2 py-1 border rounded" value={email} onChange={e => setEmail(e.target.value)} />
          <label className="block text-xs text-muted-foreground">Password</label>
          <input type="password" className="w-full mb-3 px-2 py-1 border rounded" value={password} onChange={e => setPassword(e.target.value)} />
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => setShow(false)}>Cancel</Button>
            <Button size="sm" onClick={handleLogin} disabled={loading}>Sign in</Button>
          </div>
        </div>
      )}
    </div>
  );
};