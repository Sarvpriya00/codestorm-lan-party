import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { Layout } from "@/components/Layout";
import { Dashboard } from "@/pages/Dashboard";
import { Problems } from "@/pages/Problems";
import { Leaderboard } from "@/pages/Leaderboard";
import { Login } from "@/pages/Login";
import { JudgeQueue } from "@/pages/JudgeQueue";
import { MySubmissions } from "@/pages/MySubmissions";
import { AdminUsers } from "@/pages/AdminUsers";
import { AdminAnalytics } from "@/pages/AdminAnalytics";
import { AdminControl } from "@/pages/AdminControl";
import NotFound from "./pages/NotFound";
import { PERMISSIONS } from "@/constants/permissions";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <OfflineIndicator />
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={
              <Layout requiredPermissions={[PERMISSIONS.DASHBOARD]}>
                <Dashboard />
              </Layout>
            } />
            <Route path="/problems" element={
              <Layout requiredPermissions={[PERMISSIONS.PROBLEMS]}>
                <Problems />
              </Layout>
            } />
            <Route path="/leaderboard" element={
              <Layout requiredPermissions={[PERMISSIONS.DASHBOARD]}>
                <Leaderboard />
              </Layout>
            } />
            <Route path="/judge" element={
              <Layout requiredPermissions={[PERMISSIONS.JUDGE_QUEUE]}>
                <JudgeQueue />
              </Layout>
            } />
            <Route path="/submissions" element={
              <Layout requiredPermissions={[PERMISSIONS.ADD_SUBMISSION]}>
                <MySubmissions />
              </Layout>
            } />
            <Route path="/admin/users" element={
              <Layout requiredPermissions={[PERMISSIONS.USERS]}>
                <AdminUsers />
              </Layout>
            } />
            <Route path="/admin/analytics" element={
              <Layout requiredPermissions={[PERMISSIONS.ANALYTICS]}>
                <AdminAnalytics />
              </Layout>
            } />
            <Route path="/admin/control" element={
              <Layout requiredPermissions={[PERMISSIONS.CONTEST_CONTROL]}>
                <AdminControl />
              </Layout>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
