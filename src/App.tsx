import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import Index from "./pages/Index";
import { lazyRetry } from "@/lib/lazyRetry";

const Auth = lazyRetry(() => import("./pages/Auth"), "Auth");
const ResetPassword = lazyRetry(() => import("./pages/ResetPassword"), "ResetPassword");
const Profile = lazyRetry(() => import("./pages/Profile"), "Profile");
const AdminDashboard = lazyRetry(() => import("./pages/AdminDashboard"), "AdminDashboard");
const Analytics = lazyRetry(() => import("./pages/Analytics"), "Analytics");
const About = lazyRetry(() => import("./pages/About"), "About");
const NotFound = lazyRetry(() => import("./pages/NotFound"), "NotFound");

const RouteFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <Loader2 className="h-6 w-6 animate-spin text-primary" />
  </div>
);

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/about" element={<About />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
