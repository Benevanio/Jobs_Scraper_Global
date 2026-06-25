import { useAuth } from "@/domains/auth/application/AuthContext";
import AuthCallbackPage from "@/domains/auth/presentation/pages/AuthCallbackPage";
import LoginPage from "@/domains/auth/presentation/pages/LoginPage";
import RegisterPage from "@/domains/auth/presentation/pages/RegisterPage";
import DashboardPage from "@/domains/jobs/presentation/pages/DashboardPage";
import LandingPage from "@/domains/marketing/presentation/pages/LandingPage";
import NotFound from "@/app/NotFound";
import Loading from "@/shared/ui/Loading";
import { Navigate, Route, Routes } from "react-router-dom";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <Loading />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <Loading />;
  if (user) return <Navigate to="/app" replace />;
  return <>{children}</>;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        }
      />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
