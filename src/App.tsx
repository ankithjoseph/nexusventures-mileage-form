import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from '@/contexts/AuthContext';
import React from 'react';
import Login from './pages/Login';
import VerifyEmail from './pages/VerifyEmail';
import ResetPassword from './pages/ResetPassword';
import RequireAuth from '@/components/RequireAuth';
import Index from "./pages/Index";
import ExpenseReport from "./pages/ExpenseReport";
import MileageBook from "./pages/MileageBook";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";

// Redirect component for external URLs
const ExternalRedirect = ({ to }: { to: string }) => {
  React.useEffect(() => {
    window.location.href = to;
  }, [to]);
  return null;
};

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
              <Route path="/login" element={<Login />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              {/* Protected routes - require authentication */}
              <Route
                path="/"
                element={<ExternalRedirect to="https://www.nexusventures.eu" />}
              />
              <Route
                path="/expense-report"
                element={
                  <RequireAuth>
                    <ExpenseReport />
                  </RequireAuth>
                }
              />
              <Route
                path="/mileage-book"
                element={
                  <RequireAuth>
                    <MileageBook />
                  </RequireAuth>
                }
              />

              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
