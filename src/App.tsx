import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from '@/contexts/AuthContext';
import Login from './pages/Login';
import VerifyEmail from './pages/VerifyEmail';
import ResetPassword from './pages/ResetPassword';
import RequireAuth from '@/components/RequireAuth';
import ExpenseReport from "./pages/ExpenseReport";
import MileageBook from "./pages/MileageBook";
import SepaDd from "./pages/SepaDd";
import CardPayment from "./pages/CardPayment";
import FileUpload from "./pages/FileUpload";
import ExternalRedirect from "./pages/ExternalRedirect";
import NotFound from "./pages/NotFound";
import PageMeta from '@/components/PageMeta';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<PageMeta title="Login" description="Sign in to your Nexus Ventures account." image="/logo.png" canonical="https://www.nexusventures.eu/login"><Login /></PageMeta>} />
              <Route path="/verify-email" element={<PageMeta title="Verify email" description="Verify your email to activate your account." image="/logo.png" canonical="https://www.nexusventures.eu/verify-email"><VerifyEmail /></PageMeta>} />
              <Route path="/reset-password" element={<PageMeta title="Reset password" description="Reset your account password." image="/logo.png" canonical="https://www.nexusventures.eu/reset-password"><ResetPassword /></PageMeta>} />

              {/* Protected routes - require authentication */}
              <Route path="/" element={<ExternalRedirect url="https://www.nexusventures.eu" />} />
              <Route path="/expense-report" element={<RequireAuth><PageMeta title="Expense Report" description="Create and manage your expense reports." image="/logo.png" canonical="https://www.nexusventures.eu/expense-report"><ExpenseReport /></PageMeta></RequireAuth>} />
              <Route path="/mileage-book" element={<RequireAuth><PageMeta title="Mileage Book" description="Log and manage mileage trips for tax purposes." image="/logo.png" canonical="https://www.nexusventures.eu/mileage-book"><MileageBook /></PageMeta></RequireAuth>} />
              <Route path="/sepa-dd" element={<RequireAuth><PageMeta title="SEPA Direct Debit" description="Submit SEPA Direct Debit mandate details for Nexus Ventures." image="/logo.png" canonical="https://www.nexusventures.eu/sepa-dd"><SepaDd /></PageMeta></RequireAuth>} />
              <Route path="/card-payment" element={<RequireAuth><PageMeta title="Card Payment" description="Make a card payment securely." image="/logo.png" canonical="https://www.nexusventures.eu/card-payment"><CardPayment /></PageMeta></RequireAuth>} />
              <Route path="/file-upload" element={<RequireAuth><PageMeta title="File Upload" description="Upload files securely to Nexus Ventures." image="/logo.png" canonical="https://www.nexusventures.eu/file-upload"><FileUpload /></PageMeta></RequireAuth>} />

              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<PageMeta title="Page not found" description="The page you were looking for could not be found." image="/logo.png" canonical="https://www.nexusventures.eu/404"><NotFound /></PageMeta>} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
