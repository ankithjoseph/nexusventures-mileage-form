import { Link, useLocation } from "react-router-dom";
import { FileText, Receipt, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from "@/contexts/LanguageContext";
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
              <AuthButtons />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

const AuthButtons = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (user) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">{user?.email ?? user?.username}</span>
        <Button size="sm" variant="ghost" onClick={() => { logout(); navigate('/login'); }}>
          Logout
        </Button>
      </div>
    );
  }

  return (
    <Button size="sm" onClick={() => navigate('/login')}>
      Login
    </Button>
  );
};