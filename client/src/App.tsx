import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/home";
import Admin from "@/pages/admin";
import AuthPage from "@/pages/auth-page";
import NotFound from "@/pages/not-found";
import RestrictedAccess from "@/pages/admin-login";
import AdditionalGainsPage from "@/pages/additional-gains";
import ComparisonPage from "@/pages/comparison";
import { ProtectedRoute, AdminProtectedRoute } from "@/lib/protected-route";
import { AuthProvider } from "@/hooks/use-auth";

function Router() {
  return (
    <Switch>
      {/* Página de login na raiz e no path /auth para acesso direto */}
      <Route path="/" component={AuthPage} />
      <Route path="/auth" component={AuthPage} />
      
      {/* Rotas protegidas */}
      <ProtectedRoute path="/form" component={Home} />
      <ProtectedRoute path="/additional-gains" component={AdditionalGainsPage} />
      
      {/* Rotas administrativas */}
      <AdminProtectedRoute path="/admin/dashboard" component={() => <Admin />} />
      <AdminProtectedRoute path="/admin/users" component={() => <Admin />} />
      <AdminProtectedRoute path="/admin/formulas" component={() => <Admin />} />
      <AdminProtectedRoute path="/admin/comparison" component={ComparisonPage} />
      <AdminProtectedRoute path="/admin" component={() => <Admin />} />
      
      {/* Página não encontrada - redirecionará para a página inicial */}
      <Route path="*" component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;