import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <Layout>
              <Dashboard />
            </Layout>
          } />
          <Route path="/problems" element={
            <Layout>
              <Problems />
            </Layout>
          } />
          <Route path="/leaderboard" element={
            <Layout>
              <Leaderboard />
            </Layout>
          } />
          <Route path="/judge" element={
            <Layout>
              <JudgeQueue />
            </Layout>
          } />
          <Route path="/submissions" element={
            <Layout>
              <MySubmissions />
            </Layout>
          } />
          <Route path="/admin/users" element={
            <Layout>
              <AdminUsers />
            </Layout>
          } />
          <Route path="/admin/analytics" element={
            <Layout>
              <AdminAnalytics />
            </Layout>
          } />
          <Route path="/admin/control" element={
            <Layout>
              <AdminControl />
            </Layout>
          } />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
