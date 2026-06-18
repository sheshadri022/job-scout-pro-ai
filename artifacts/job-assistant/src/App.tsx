import React from "react";
import { Router, Switch, Route, Redirect } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { queryClient } from "@/lib/queryClient";
import { AuthProvider, useAuth } from "@/contexts/auth";

import { isSupabaseConfigured } from "@/lib/supabase";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Jobs from "@/pages/jobs";
import JobDetail from "@/pages/job-detail";
import Resume from "@/pages/resume";
import Settings from "@/pages/settings";
import Applications from "@/pages/applications";
import SignInPage from "@/pages/sign-in";
import SignUpPage from "@/pages/sign-up";
import NotFound from "@/pages/not-found";
import { Layout } from "@/components/layout";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function HomeRedirect() {
  const { isSignedIn, isLoaded } = useAuth();
  if (!isLoaded) return null;
  if (isSignedIn) return <Redirect to="/dashboard" />;
  return <Landing />;
}

function ProtectedRoute({
  component: Component,
}: {
  component: React.ComponentType;
}) {
  const { isSignedIn, isLoaded } = useAuth();
  if (!isLoaded) return null;
  if (!isSignedIn) return <Redirect to="/sign-in" />;
  return (
    <Layout>
      <Component />
    </Layout>
  );
}

function SetupGate({ children }: { children: React.ReactNode }) {
  if (!isSupabaseConfigured) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md w-full bg-white rounded-2xl border border-amber-200 shadow-lg p-8 text-center space-y-4">
          <div className="text-4xl">🔧</div>
          <h1 className="text-xl font-bold text-slate-900">Supabase not configured</h1>
          <p className="text-sm text-slate-600">
            Add your Supabase project credentials as environment variables to continue:
          </p>
          <div className="text-left bg-slate-50 rounded-lg border border-slate-200 p-4 space-y-1 font-mono text-xs text-slate-700">
            <div><span className="text-amber-600">VITE_SUPABASE_URL</span>=https://xxx.supabase.co</div>
            <div><span className="text-amber-600">VITE_SUPABASE_ANON_KEY</span>=eyJ...</div>
          </div>
          <p className="text-xs text-slate-400">
            Get these from your Supabase project → Settings → API
          </p>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Switch>
      <Route path="/" component={HomeRedirect} />
      <Route path="/sign-in" component={SignInPage} />
      <Route path="/sign-up" component={SignUpPage} />
      <Route
        path="/dashboard"
        component={() => <ProtectedRoute component={Dashboard} />}
      />
      <Route
        path="/jobs"
        component={() => <ProtectedRoute component={Jobs} />}
      />
      <Route
        path="/jobs/:id"
        component={() => <ProtectedRoute component={JobDetail} />}
      />
      <Route
        path="/resume"
        component={() => <ProtectedRoute component={Resume} />}
      />
      <Route
        path="/settings"
        component={() => <ProtectedRoute component={Settings} />}
      />
      <Route
        path="/applications"
        component={() => <ProtectedRoute component={Applications} />}
      />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router base={basePath}>
          <SetupGate>
            <AuthProvider>
              <AppRoutes />
            </AuthProvider>
          </SetupGate>
        </Router>
        <Toaster richColors position="top-right" />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
