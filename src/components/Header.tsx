import { Link, useLocation } from "react-router-dom";
import { FileText, Receipt, Languages, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
    const userEmail = user?.email ?? user?.username ?? 'User';
    const initials = userEmail.charAt(0).toUpperCase();

    const handleLogout = () => {
      logout();
      navigate('/login');
    };

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-9 w-9 rounded-full">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-primary text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">My Account</p>
              <p className="text-xs leading-none text-muted-foreground">
                {userEmail}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Button size="sm" onClick={() => navigate('/login')}>
      <User className="mr-2 h-4 w-4" />
      Login
    </Button>
  );
};