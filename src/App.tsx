import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Services from "./pages/Services";
import About from "./pages/About";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";
import { AuthProvider } from "@/lib/AuthContext";
import AuthPage from "./pages/Auth";
import Profile from "./pages/Profile";
import EmailConfirmed from "./pages/EmailConfirmed";
import CustomerDashboard from "./pages/CustomerDashboard";
import StaffDashboard from "./pages/StaffDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Messages from "./pages/Messages";
import ChatRoom from "./pages/ChatRoom";
import StaffChat from "./pages/StaffChat";
import ScrollToTop from "@/components/ScrollToTop";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
        <ScrollToTop />
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/services" element={<Services />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/email-confirmed" element={<EmailConfirmed />} />
              <Route path="/customer-dashboard" element={<CustomerDashboard />} />
              <Route path="/staff-dashboard" element={<StaffDashboard />} />
              <Route path="/admin-dashboard" element={<AdminDashboard />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/chat/:id" element={<ChatRoom />} />
              <Route path="/staff-chat" element={<StaffChat/>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;