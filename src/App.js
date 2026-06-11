import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { PublicRoute } from './components/auth/PublicRoute';
import { Dashboard } from './pages/Dashboard';
import { Projects } from './pages/Projects';
import { ProjectDetail } from './pages/ProjectDetail';
import { NewProject } from './pages/NewProject';
import { Viewer } from './pages/Viewer';
import { Settings } from './pages/Settings';
import { Plan } from './pages/Plan';
import { Help } from './pages/Help';
import { Images } from './pages/Images';
import { PublicSharedProject } from './pages/PublicSharedProject';
import { PublicSharedProjectImage } from './pages/PublicSharedProjectImage';
import { PublicStandaloneImage } from './pages/PublicStandaloneImage';
import { LegacyShareImageRedirect } from './pages/LegacyShareImageRedirect';
import { PublicPortfolio } from './pages/PublicPortfolio';
import { PublicPortfolioProject } from './pages/PublicPortfolioProject';
import { PublicPortfolioImage } from './pages/PublicPortfolioImage';
import { Login } from './pages/Login';
import { SignUp } from './pages/SignUp';
import { ForgotPassword } from './pages/ForgotPassword';
import { VerifyEmail } from './pages/VerifyEmail';
import { VerifyEmailAction } from './pages/VerifyEmailAction';
import { ResetPasswordAction } from './pages/ResetPasswordAction';
import { VerifyEmailRoute } from './components/auth/VerifyEmailRoute';
import { Landing } from './pages/Landing';
import { LandingRoute } from './components/auth/LandingRoute';
import { TermsOfUse } from './pages/TermsOfUse';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { NotFound } from './pages/NotFound';

function App() {
  return (
    <div className="App">
      <Toaster />
      <BrowserRouter>
        <Routes>
          {/* Public Routes - No Sidebar */}
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><SignUp /></PublicRoute>} />
          <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
          <Route path="/verify-email" element={<VerifyEmailRoute><VerifyEmail /></VerifyEmailRoute>} />
          <Route path="/verify-email/action" element={<VerifyEmailAction />} />
          <Route path="/reset-password/action" element={<ResetPasswordAction />} />

          {/* Portfólio público */}
          <Route path="/u/:slug" element={<PublicPortfolio />} />
          <Route path="/u/:slug/project/:projectId" element={<PublicPortfolioProject />} />
          <Route path="/u/:slug/project/:projectId/image/:imageId" element={<PublicPortfolioImage />} />

          {/* Compartilhamento direto */}
          <Route path="/share/project/:projectId" element={<PublicSharedProject />} />
          <Route path="/share/project/:projectId/image/:imageId" element={<PublicSharedProjectImage />} />
          <Route path="/share/standalone/:imageId" element={<PublicStandaloneImage />} />

          {/* Compatibilidade com rotas antigas */}
          <Route path="/share/image/:imageId" element={<LegacyShareImageRedirect />} />

          <Route path="/termos" element={<TermsOfUse />} />
          <Route path="/privacidade" element={<PrivacyPolicy />} />
          <Route path="/" element={<LandingRoute><Landing /></LandingRoute>} />

          {/* Private Routes - With Sidebar */}
          <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
          <Route path="/projects" element={<ProtectedRoute><Layout><Projects /></Layout></ProtectedRoute>} />
          <Route path="/projects/new" element={<ProtectedRoute><Layout><NewProject /></Layout></ProtectedRoute>} />
          <Route path="/projects/:id" element={<ProtectedRoute><Layout><ProjectDetail /></Layout></ProtectedRoute>} />
          <Route path="/images" element={<ProtectedRoute><Layout><Images /></Layout></ProtectedRoute>} />
          <Route path="/viewer/:imageId" element={<ProtectedRoute><Viewer /></ProtectedRoute>} />
          <Route path="/plan" element={<ProtectedRoute><Layout><Plan /></Layout></ProtectedRoute>} />
          <Route path="/pricing" element={<Navigate to="/plan" replace />} />
          <Route path="/settings" element={<ProtectedRoute><Layout><Settings /></Layout></ProtectedRoute>} />
          <Route path="/help" element={<ProtectedRoute><Layout><Help /></Layout></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
