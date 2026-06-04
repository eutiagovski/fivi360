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
import { PublicProject } from './pages/PublicProject';
import { PublicImage } from './pages/PublicImage';
import { PublicPortfolio } from './pages/PublicPortfolio';
import { Login } from './pages/Login';
import { SignUp } from './pages/SignUp';
import { ForgotPassword } from './pages/ForgotPassword';
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
          <Route path="/share/project/:id" element={<PublicProject />} />
          <Route path="/share/image/:imageId" element={<PublicImage />} />
          <Route path="/u/:slug" element={<PublicPortfolio />} />
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
