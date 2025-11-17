import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import Login from "./pages/Login";
import VerifyEmail from "./pages/VerifyEmail";
import ResetPassword from "./pages/ResetPassword";
import RequireAuth from "@/components/RequireAuth";
import ExpenseReport from "./pages/ExpenseReport";
import MileageBook from "./pages/MileageBook";
import SepaDd from "./pages/SepaDd";
import CardPayment from "./pages/CardPayment";
import FileUpload from "./pages/FileUpload";
import CompanyIncorporation from "./pages/CompanyIncorporation";
import ExternalRedirect from "./pages/ExternalRedirect";
import NotFound from "./pages/NotFound";
import PageMeta from "@/components/PageMeta";
import { routeMeta } from "./routeMeta";

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
              <Route
                path={routeMeta.login.path}
                element={
                  <PageMeta
                    title={routeMeta.login.title}
                    ogTitle={routeMeta.login.ogTitle}
                    description={routeMeta.login.description}
                    image={routeMeta.login.image}
                    canonical={routeMeta.login.canonical}
                  >
                    <Login />
                  </PageMeta>
                }
              />
              <Route
                path={routeMeta.verifyEmail.path}
                element={
                  <PageMeta
                    title={routeMeta.verifyEmail.title}
                    ogTitle={routeMeta.verifyEmail.ogTitle}
                    description={routeMeta.verifyEmail.description}
                    image={routeMeta.verifyEmail.image}
                    canonical={routeMeta.verifyEmail.canonical}
                  >
                    <VerifyEmail />
                  </PageMeta>
                }
              />
              <Route
                path={routeMeta.resetPassword.path}
                element={
                  <PageMeta
                    title={routeMeta.resetPassword.title}
                    ogTitle={routeMeta.resetPassword.ogTitle}
                    description={routeMeta.resetPassword.description}
                    image={routeMeta.resetPassword.image}
                    canonical={routeMeta.resetPassword.canonical}
                  >
                    <ResetPassword />
                  </PageMeta>
                }
              />

              {/* Protected routes - require authentication */}
              <Route path="/" element={<ExternalRedirect url="https://www.nexusventures.eu" />} />
              <Route
                path={routeMeta.expenseReport.path}
                element={
                  <RequireAuth>
                    <PageMeta
                      title={routeMeta.expenseReport.title}
                      ogTitle={routeMeta.expenseReport.ogTitle}
                      description={routeMeta.expenseReport.description}
                      image={routeMeta.expenseReport.image}
                      canonical={routeMeta.expenseReport.canonical}
                    >
                      <ExpenseReport />
                    </PageMeta>
                  </RequireAuth>
                }
              />
              <Route
                path={routeMeta.mileageBook.path}
                element={
                  <RequireAuth>
                    <PageMeta
                      title={routeMeta.mileageBook.title}
                      ogTitle={routeMeta.mileageBook.ogTitle}
                      description={routeMeta.mileageBook.description}
                      image={routeMeta.mileageBook.image}
                      canonical={routeMeta.mileageBook.canonical}
                    >
                      <MileageBook />
                    </PageMeta>
                  </RequireAuth>
                }
              />
              <Route
                path={routeMeta.sepaDd.path}
                element={
                  <RequireAuth>
                    <PageMeta
                      title={routeMeta.sepaDd.title}
                      ogTitle={routeMeta.sepaDd.ogTitle}
                      description={routeMeta.sepaDd.description}
                      image={routeMeta.sepaDd.image}
                      canonical={routeMeta.sepaDd.canonical}
                    >
                      <SepaDd />
                    </PageMeta>
                  </RequireAuth>
                }
              />
              <Route
                path={routeMeta.cardPayment.path}
                element={
                  <RequireAuth>
                    <PageMeta
                      title={routeMeta.cardPayment.title}
                      ogTitle={routeMeta.cardPayment.ogTitle}
                      description={routeMeta.cardPayment.description}
                      image={routeMeta.cardPayment.image}
                      canonical={routeMeta.cardPayment.canonical}
                    >
                      <CardPayment />
                    </PageMeta>
                  </RequireAuth>
                }
              />
              <Route
                path={routeMeta.amlForm.path}
                element={
                  <RequireAuth>
                    <PageMeta
                      title={routeMeta.amlForm.title}
                      ogTitle={routeMeta.amlForm.ogTitle}
                      description={routeMeta.amlForm.description}
                      image={routeMeta.amlForm.image}
                      canonical={routeMeta.amlForm.canonical}
                    >
                      <FileUpload />
                    </PageMeta>
                  </RequireAuth>
                }
              />
              <Route
                path={routeMeta.companyIncorporation.path}
                element={
                  <RequireAuth>
                    <PageMeta
                      title={routeMeta.companyIncorporation.title}
                      ogTitle={routeMeta.companyIncorporation.ogTitle}
                      description={routeMeta.companyIncorporation.description}
                      image={routeMeta.companyIncorporation.image}
                      canonical={routeMeta.companyIncorporation.canonical}
                    >
                      <CompanyIncorporation />
                    </PageMeta>
                  </RequireAuth>
                }
              />

              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route
                path={routeMeta.notFound.path}
                element={
                  <PageMeta
                    title={routeMeta.notFound.title}
                    ogTitle={routeMeta.notFound.ogTitle}
                    description={routeMeta.notFound.description}
                    image={routeMeta.notFound.image}
                    canonical={routeMeta.notFound.canonical}
                  >
                    <NotFound />
                  </PageMeta>
                }
              />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
