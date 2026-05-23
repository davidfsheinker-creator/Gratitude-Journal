import { Switch, Route, Router as WouterRouter, Redirect, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme-provider";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { Layout } from "@/components/layout";
import { Home } from "@/pages/home";
import { Journal } from "@/pages/journal";
import { EntryDetail } from "@/pages/entry-detail";
import { Week } from "@/pages/week";
import { Favorites } from "@/pages/favorites";
import { Calendar } from "@/pages/calendar";
import { Login } from "@/pages/login";
import { Signup } from "@/pages/signup";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, refetchOnWindowFocus: false },
  },
});

function ProtectedRoute({ component: Component, params }: { component: React.ComponentType<{ params?: Record<string, string> }>, params?: Record<string, string> }) {
  const { token } = useAuth();
  const [location] = useLocation();
  if (!token) return <Redirect to={`/login?redirect=${encodeURIComponent(location)}`} />;
  return <Component params={params} />;
}

function AuthRoute({ component: Component }: { component: React.ComponentType }) {
  const { token } = useAuth();
  if (token) return <Redirect to="/" />;
  return <Component />;
}

function Router() {
  const { token } = useAuth();
  const [location] = useLocation();

  return (
    <Switch>
      <Route path="/login">
        <AuthRoute component={Login} />
      </Route>
      <Route path="/signup">
        <AuthRoute component={Signup} />
      </Route>

      <Route path="/">
        {token ? (
          <Layout><Home /></Layout>
        ) : (
          <Redirect to={`/login?redirect=${encodeURIComponent(location)}`} />
        )}
      </Route>
      <Route path="/journal">
        {token ? (
          <Layout><Journal /></Layout>
        ) : (
          <Redirect to={`/login?redirect=${encodeURIComponent(location)}`} />
        )}
      </Route>
      <Route path="/journal/:date">
        {(params) => token ? (
          <Layout><EntryDetail params={params} /></Layout>
        ) : (
          <Redirect to={`/login?redirect=${encodeURIComponent(location)}`} />
        )}
      </Route>
      <Route path="/week">
        {token ? (
          <Layout><Week /></Layout>
        ) : (
          <Redirect to={`/login?redirect=${encodeURIComponent(location)}`} />
        )}
      </Route>
      <Route path="/favorites">
        {token ? (
          <Layout><Favorites /></Layout>
        ) : (
          <Redirect to={`/login?redirect=${encodeURIComponent(location)}`} />
        )}
      </Route>
      <Route path="/calendar">
        {token ? (
          <Layout><Calendar /></Layout>
        ) : (
          <Redirect to={`/login?redirect=${encodeURIComponent(location)}`} />
        )}
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Router />
            </WouterRouter>
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
