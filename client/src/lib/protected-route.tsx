import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";

/**
 * Componente para proteger rotas que requerem autenticação.
 * Redireciona para a página de login se o usuário não estiver autenticado.
 */
export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element;
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      </Route>
    );
  }

  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  return <Route path={path} component={Component} />;
}

/**
 * Componente para proteger rotas que requerem acesso administrativo.
 * Redireciona para a página principal se o usuário não for administrador.
 */
export function AdminProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element;
}) {
  const { user, isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      </Route>
    );
  }

  // Se o usuário não estiver autenticado, redirecionar para página de login
  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  // Se o usuário estiver autenticado mas não for admin, redirecionar para página do formulário
  if (!isAdmin) {
    return (
      <Route path={path}>
        <Redirect to="/form" />
      </Route>
    );
  }

  // Se o usuário for admin, renderizar o componente
  return <Route path={path} component={Component} />;
}