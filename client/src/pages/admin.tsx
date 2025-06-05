import { useEffect } from "react";
import { Route, Switch, useLocation } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import AdminDashboard from "./admin-dashboard";
import ManageUsers from "./manage-users";
import AdminFormulasPage from "./admin-formulas";
import { useAuth } from "@/hooks/use-auth";

export default function Admin() {
  const [location, navigate] = useLocation();
  const { isAdmin } = useAuth();
  
  // Verificar o caminho atual e redirecionar para a página adequada
  useEffect(() => {
    // Se estamos na raiz administrativa, redirecionar para o dashboard
    if (location === "/admin") {
      navigate("/admin/dashboard");
    }
  }, [location, navigate]);

  return (
    <>
      <Switch>
        <Route path="/admin/dashboard" component={AdminDashboard} />
        <Route path="/admin/users" component={ManageUsers} />
        <Route path="/admin/formulas" component={AdminFormulasPage} />
        <Route path="*">
          <div className="flex min-h-screen flex-col items-center justify-center">
            <h1 className="text-2xl font-bold mb-4">Página não encontrada</h1>
            <button 
              className="bg-primary text-white px-4 py-2 rounded"
              onClick={() => navigate("/admin/dashboard")}
            >
              Voltar para o Dashboard
            </button>
          </div>
        </Route>
      </Switch>
      <Toaster />
    </>
  );
}