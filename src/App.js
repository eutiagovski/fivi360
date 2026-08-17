import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { AnalyticsRouteTracker } from "@/components/analytics/AnalyticsRouteTracker";
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { GuestRoute } from './components/auth/GuestRoute';
import { PublicAlwaysRoute } from './components/auth/PublicAlwaysRoute';
import { Dashboard } from './pages/Dashboard';
import { Projects } from './pages/Projects';
import { ProjectDetail } from './pages/ProjectDetail';
import { NewProject } from './pages/NewProject';
import { Viewer } from './pages/Viewer';
import { Settings } from './pages/Settings';
import { Plan } from './pages/Plan';
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
import { VerifyEmailSent } from './pages/VerifyEmailSent';
import { VerifyEmailAction } from './pages/VerifyEmailAction';
import { ResetPasswordAction } from './pages/ResetPasswordAction';
import { VerifyEmailRoute } from './components/auth/VerifyEmailRoute';
import { Landing } from './pages/Landing';
import { TermsOfUse } from './pages/TermsOfUse';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { NotFound } from './pages/NotFound';
import { EmbedProjectPage } from './pages/EmbedProject';
import { AccessEarlyLandingPage } from './landing-pages/access-early';
import { AccessEarlySuccessPage } from './landing-pages/access-early/AccessEarlySuccessPage';
import { HelpCenterApp } from './help';

/**
 * Classificação de rotas (RC-LP-ROUTING-1):
 * - PUBLIC_ALWAYS: autenticado ou não; sem redirect por sessão; sem LegalConsentGate
 * - GUEST_ONLY: visitantes; autenticado → /dashboard
 * - PRIVATE: ProtectedRoute + LegalConsentGate
 */
function App() {
  return (
    <div className="App">
      <Toaster />
      <BrowserRouter>
        <AnalyticsRouteTracker />
        <Routes>
          {/* GUEST_ONLY — auth pages */}
          <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
          <Route path="/register" element={<GuestRoute><SignUp /></GuestRoute>} />
          <Route path="/forgot-password" element={<GuestRoute><ForgotPassword /></GuestRoute>} />
          <Route path="/verify-email" element={<VerifyEmailRoute><VerifyEmail /></VerifyEmailRoute>} />
          <Route path="/verify-email-sent" element={<VerifyEmailSent />} />
          <Route path="/verify-email/action" element={<VerifyEmailAction />} />
          <Route path="/reset-password/action" element={<ResetPasswordAction />} />

          {/* PUBLIC_ALWAYS — embed */}
          <Route path="/embed/:projectId" element={<EmbedProjectPage />} />
          <Route path="/embed/:projectId/image/:imageId" element={<EmbedProjectPage />} />

          {/* PUBLIC_ALWAYS — portfólio */}
          <Route path="/u/:slug" element={<PublicPortfolio />} />
          <Route path="/u/:slug/project/:projectId" element={<PublicPortfolioProject />} />
          <Route path="/u/:slug/project/:projectId/image/:imageId" element={<PublicPortfolioImage />} />

          {/* PUBLIC_ALWAYS — compartilhamento */}
          <Route path="/share/project/:projectId" element={<PublicSharedProject />} />
          <Route path="/share/project/:projectId/image/:imageId" element={<PublicSharedProjectImage />} />
          <Route path="/share/standalone/:imageId" element={<PublicStandaloneImage />} />
          <Route path="/share/image/:imageId" element={<LegacyShareImageRedirect />} />

          {/* PUBLIC_ALWAYS — legais */}
          <Route path="/termos" element={<TermsOfUse />} />
          <Route path="/privacidade" element={<PrivacyPolicy />} />

          {/* PUBLIC_ALWAYS — Central de Ajuda */}
          <Route
            path="/ajuda/*"
            element={
              <PublicAlwaysRoute>
                <HelpCenterApp />
              </PublicAlwaysRoute>
            }
          />
          <Route path="/help" element={<Navigate to="/ajuda" replace />} />
          <Route path="/help/*" element={<Navigate to="/ajuda" replace />} />

          {/* PUBLIC_ALWAYS — Home institucional */}
          <Route path="/" element={<PublicAlwaysRoute><Landing /></PublicAlwaysRoute>} />

          {/* PUBLIC_ALWAYS — Landing Pages de campanha (/lp/*) */}
          <Route
            path="/lp/acesso-antecipado"
            element={
              <PublicAlwaysRoute>
                <AccessEarlyLandingPage />
              </PublicAlwaysRoute>
            }
          />
          <Route
            path="/lp/acesso-antecipado/sucesso"
            element={
              <PublicAlwaysRoute>
                <AccessEarlySuccessPage />
              </PublicAlwaysRoute>
            }
          />

          {/* PRIVATE — app autenticado */}
          <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
          <Route path="/projects" element={<ProtectedRoute><Layout><Projects /></Layout></ProtectedRoute>} />
          <Route path="/projects/new" element={<ProtectedRoute><Layout><NewProject /></Layout></ProtectedRoute>} />
          <Route path="/projects/:id" element={<ProtectedRoute><Layout><ProjectDetail /></Layout></ProtectedRoute>} />
          <Route path="/images" element={<ProtectedRoute><Layout><Images /></Layout></ProtectedRoute>} />
          <Route path="/viewer/:imageId" element={<ProtectedRoute><Viewer /></ProtectedRoute>} />
          <Route path="/plan" element={<ProtectedRoute><Layout><Plan /></Layout></ProtectedRoute>} />
          <Route path="/pricing" element={<Navigate to="/plan" replace />} />
          <Route path="/settings" element={<ProtectedRoute><Layout><Settings /></Layout></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
