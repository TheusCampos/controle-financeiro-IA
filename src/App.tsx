import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";

// Lazy loading pages for better performance
const DashboardPage = lazy(() => import("@/pages/Dashboard/DashboardPage"));
const AssistantPage = lazy(() => import("@/pages/Assistant/AssistantPage"));
const CardsPage = lazy(() => import("@/pages/Cards/CardsPage"));
const TransactionsPage = lazy(() => import("@/pages/Transactions/TransactionsPage"));
const BudgetsPage = lazy(() => import("@/pages/Budgets/BudgetsPage"));
const GoalsPage = lazy(() => import("@/pages/Goals/GoalsPage"));
const ReportsPage = lazy(() => import("@/pages/Reports/ReportsPage"));
const SettingsPage = lazy(() => import("@/pages/Settings/SettingsPage"));
const AuthPage = lazy(() => import("@/pages/Auth/AuthPage"));
const ResetPasswordPage = lazy(() => import("@/pages/ResetPassword/ResetPasswordPage"));
const NotFound = lazy(() => import("@/pages/NotFound/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <TooltipProvider>
        <Sonner position="top-right" closeButton />
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              
              <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/assistant" element={<AssistantPage />} />
                <Route path="/cards" element={<CardsPage />} />
                <Route path="/transactions" element={<TransactionsPage />} />
                <Route path="/budgets" element={<BudgetsPage />} />
                <Route path="/goals" element={<GoalsPage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
