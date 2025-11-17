export type RouteMetaKey =
  | "login"
  | "verifyEmail"
  | "resetPassword"
  | "expenseReport"
  | "mileageBook"
  | "sepaDd"
  | "cardPayment"
  | "amlForm"
  | "companyIncorporation"
  | "notFound";

export interface RouteMetaConfig {
  path: string;
  title: string;
  ogTitle: string;
  description: string;
  image: string;
  canonical: string;
}

export const routeMeta: Record<RouteMetaKey, RouteMetaConfig> = {
  login: {
    path: "/login",
    title: "Login",
    ogTitle: "Login to Nexus Ventures",
    description: "Sign in to your Nexus Ventures account.",
    image: "/logo.png",
    canonical: "https://www.nexusventures.eu/login",
  },
  verifyEmail: {
    path: "/verify-email",
    title: "Verify email",
    ogTitle: "Verify your email",
    description: "Verify your email to activate your account.",
    image: "/logo.png",
    canonical: "https://www.nexusventures.eu/verify-email",
  },
  resetPassword: {
    path: "/reset-password",
    title: "Reset password",
    ogTitle: "Reset your password",
    description: "Reset your account password.",
    image: "/logo.png",
    canonical: "https://www.nexusventures.eu/reset-password",
  },
  expenseReport: {
    path: "/expense-report",
    title: "Expense Report",
    ogTitle: "Expense Report - Nexus Ventures",
    description: "Create and manage your expense reports.",
    image: "/logo.png",
    canonical: "https://www.nexusventures.eu/expense-report",
  },
  mileageBook: {
    path: "/mileage-book",
    title: "Mileage Book",
    ogTitle: "Mileage Book - Nexus Ventures",
    description: "Log and manage mileage trips for tax purposes.",
    image: "/logo.png",
    canonical: "https://www.nexusventures.eu/mileage-book",
  },
  sepaDd: {
    path: "/sepa-dd",
    title: "SEPA Direct Debit",
    ogTitle: "SEPA Direct Debit Mandate",
    description: "Submit SEPA Direct Debit mandate details for Nexus Ventures.",
    image: "/logo.png",
    canonical: "https://www.nexusventures.eu/sepa-dd",
  },
  cardPayment: {
    path: "/card-payment",
    title: "Card Payment",
    ogTitle: "Card Payment - Nexus Ventures",
    description: "Make a card payment securely.",
    image: "/logo.png",
    canonical: "https://www.nexusventures.eu/card-payment",
  },
  amlForm: {
    path: "/aml-form",
    title: "AML Compliance Form",
    ogTitle: "AML Compliance Form - Nexus Ventures",
    description: "Submit your Anti-Money Laundering compliance form to Nexus Ventures.",
    image: "/logo.png",
    canonical: "https://www.nexusventures.eu/aml-form",
  },
  companyIncorporation: {
    path: "/company-incorporation",
    title: "Company Incorporation",
    ogTitle: "Company Incorporation - Nexus Ventures",
    description: "Provide details required for company constitution.",
    image: "/logo.png",
    canonical: "https://www.nexusventures.eu/company-incorporation",
  },
  notFound: {
    path: "*",
    title: "Page not found",
    ogTitle: "404 - Page not found",
    description: "The page you were looking for could not be found.",
    image: "/logo.png",
    canonical: "https://www.nexusventures.eu/404",
  },
};
