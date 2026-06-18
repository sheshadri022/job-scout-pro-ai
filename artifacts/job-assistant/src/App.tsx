import React, { useEffect } from "react";
import { Router, Switch, Route, Redirect } from "wouter";
import { ClerkProvider, SignIn, SignUp, useAuth } from "@clerk/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { queryClient } from "@/lib/queryClient";
import { setAuthTokenGetter } from "@workspace/api-client-react";

import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Jobs from "@/pages/jobs";
import JobDetail from "@/pages/job-detail";
import Resume from "@/pages/resume";
import Settings from "@/pages/settings";
import Applications from "@/pages/applications";
import NotFound from "@/pages/not-found";
import { Layout } from "@/components/layout";

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY");
}

const clerkAppearance = {
  cssLayerName: "clerk",
  variables: {
    colorPrimary: "hsl(221, 83%, 53%)",
    colorForeground: "hsl(222, 47%, 11%)",
    colorMutedForeground: "hsl(215, 16%, 47%)",
    colorDanger: "hsl(0, 84%, 60%)",
    colorBackground: "hsl(0, 0%, 100%)",
    fontFamily: "Inter, sans-serif",
    borderRadius: "0.5rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox:
      "bg-white rounded-2xl w-[440px] max-w-full overflow-hidden shadow-lg border border-slate-200",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-2xl font-bold text-slate-900",
    headerSubtitle: "text-slate-500",
    formButtonPrimary:
      "bg-primary hover:bg-primary/90 text-white shadow-sm transition-all",
    footerActionLink: "text-primary hover:text-primary/90 font-medium",
  },
};

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-slate-50 px-4">
      <SignIn
        routing="path"
        path={`${basePath}/sign-in`}
        signUpUrl={`${basePath}/sign-up`}
      />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-slate-50 px-4">
      <SignUp
        routing="path"
        path={`${basePath}/sign-up`}
        signInUrl={`${basePath}/sign-in`}
      />
    </div>
  );
}

// Wires Clerk session token into the API client on every render
function AuthSetup() {
  const { getToken } = useAuth();
  useEffect(() => {
    setAuthTokenGetter(() => getToken());
    return () => setAuthTokenGetter(null);
  }, [getToken]);
  return null;
}

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
  if (!isSignedIn) return <Redirect to="/" />;
  return (
    <Layout>
      <Component />
    </Layout>
  );
}

function AppRoutes() {
  return (
    <>
    <AuthSetup />
    <Switch>
      <Route path="/" component={HomeRedirect} />
      <Route path="/sign-in/*?" component={SignInPage} />
      <Route path="/sign-up/*?" component={SignUpPage} />
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
    </>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router base={basePath}>
          <ClerkProvider
            publishableKey={clerkPubKey}
            proxyUrl={clerkProxyUrl}
            appearance={clerkAppearance}
            signInUrl={`${basePath}/sign-in`}
            signUpUrl={`${basePath}/sign-up`}
          >
            <AppRoutes />
          </ClerkProvider>
        </Router>
        <Toaster richColors position="top-right" />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
